require("dotenv").config();
const { request, gql } = require("graphql-request");
const client = require("../client");
const cron = require("cron");
const fs = require("fs");
const readline = require("readline");

const SUBGRAPH_LIST_FILE = "subgraph-ops/production-subgraphs.txt";
const GRAPH_INDEX_URL = "https://api.thegraph.com/index-node/graphql";
const BASE_QUERY = gql`
  {
    indexingStatusForCurrentVersion(subgraphName: "simplefi-finance/<SUBGRAPH_NAME>") {
      subgraph
      health
      synced
      fatalError {
        message
      }
      nonFatalErrors {
        message
      }
    }
  }
`;

/**
 * Go through  list of subgraphs and check each one's health
 */
async function checkSubgraphs() {
  const fileStream = fs.createReadStream(SUBGRAPH_LIST_FILE);
  const lines = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const subgraphName of lines) {
    query = BASE_QUERY.replace("<SUBGRAPH_NAME>", subgraphName);

    const data = await request(GRAPH_INDEX_URL, query);
    const health = data["indexingStatusForCurrentVersion"]["health"];

    if (health != "healthy") {
      alertDiscord(subgraphName, data);
    }
  }
}

/**
 * Send error message to dedicated discord alert channel
 */
function alertDiscord(subgraphName, data) {
  const discordAlertChannel = client.channels.cache.get(process.env.OPS_ID);

  let messsage = "Subgraph: " + subgraphName + "\n";
  messsage = messsage + "Health: " + data["indexingStatusForCurrentVersion"]["health"] + "\n";
  messsage =
    messsage + "Error: " + data["indexingStatusForCurrentVersion"]["fatalError"]["message"];
  messsage =
    messsage +
    "\n" +
    "--------------------------------------------------------------------------------------------";

  discordAlertChannel.send(messsage);
}

/**
 * Start cronjob
 */
module.exports = {
  startSubgraphHealthTracker: async function () {
    // every hour at min 0
    let scheduledMessage = new cron.CronJob("* * * * *", async () => {
      await checkSubgraphs();
    });

    scheduledMessage.start();
  },
};
