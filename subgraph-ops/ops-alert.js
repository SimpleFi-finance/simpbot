require("dotenv").config();
const { request, gql } = require("graphql-request");
const client = require("../client");
const cron = require("cron");
const fs = require("fs");
const readline = require("readline");

const SUBGRAPH_LIST_FILE = "subgraph-ops/production-subgraphs.txt";
const GRAPH_INDEX_URL = "https://api.thegraph.com/index-node/graphql";
const BASE_SUBGRAPH_QUERY_URL = "https://api.thegraph.com/subgraphs/name/";

const BASE_HEALTH_QUERY = gql`
  {
    indexingStatusForCurrentVersion(subgraphName: "<SUBGRAPH_NAME>") {
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

const MARKET_QUERY = gql`
  {
    markets {
      id
      inputTokenTotalBalances
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
    query = BASE_HEALTH_QUERY.replace("<SUBGRAPH_NAME>", subgraphName);

    const data = await request(GRAPH_INDEX_URL, query);
    const health = data["indexingStatusForCurrentVersion"]["health"];

    if (health != "healthy") {
      alertHealthIssue(subgraphName, data);
    }
  }
}

/**
 * Send error message to dedicated discord alert channel when subgraph is not healthy
 */
function alertHealthIssue(subgraphName, data) {
  const discordAlertChannel = client.channels.cache.get(process.env.ALERTS_CHANNEL_ID);

  let message = "Subgraph: " + subgraphName + "\n";
  message = message + "Health: " + data["indexingStatusForCurrentVersion"]["health"] + "\n";
  message = message + "Error: " + data["indexingStatusForCurrentVersion"]["fatalError"]["message"];
  message = message + "\n-------------------------------------------";

  discordAlertChannel.send(message);
}

/**
 * Go through  list of subgraphs and check if any market has negative balances
 */
async function checkNegativeBalances() {
  const fileStream = fs.createReadStream(SUBGRAPH_LIST_FILE);
  const lines = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const subgraphName of lines) {
    let queryUrl = BASE_SUBGRAPH_QUERY_URL + subgraphName;

    // query nultiple times in case of failed queries
    let count = 0;
    let maxTries = 3;
    while (count < maxTries) {
      try {
        // query markets
        const data = await request(queryUrl, MARKET_QUERY);
        let allMarkets = data["markets"];
        let faultyMarkets = [];

        // check if there are negative balances by searching for substring
        for (const market of allMarkets) {
          let inputTokenTotalBalances = market["inputTokenTotalBalances"].toString();
          if (inputTokenTotalBalances.includes("|-")) {
            // collect all faulty market ids
            faultyMarkets.push(market["id"]);
          }
        }

        // post issues to discord
        if (faultyMarkets.length > 0) {
          alertNegativeValues(subgraphName, faultyMarkets, null);
        }
        break;
      } catch (error) {
        count++;
        // if we run out if tries send the error message to discord
        if (count == maxTries) {
          let status = error["response"]["status"];
          let queryingError = "";
          if (status != 200) {
            // network/infra error
            queryingError = "Reponse status: " + status;
          } else {
            // subgraph is probably failed
            queryingError = "Error: " + error["response"]["errors"][0]["message"];
          }

          alertNegativeValues(subgraphName, null, queryingError);
        }
      }
    }
  }
}

/**
 * Send error message to dedicated discord alert channel when subgraph has negative values
 */
function alertNegativeValues(subgraphName, markets, queryingError) {
  const discordAlertChannel = client.channels.cache.get(process.env.ALERTS_CHANNEL_ID);

  if (queryingError != null) {
    let message = "Subgraph: " + subgraphName + "\n" + queryingError;
    message = message + "\n-------------------------------------------";
    discordAlertChannel.send(message);
    return;
  }

  let message = "Found negative values 😬\n";
  message = message + "Subgraph: " + subgraphName + "\n";
  message = message + "Markets: " + "\n";
  for (const market of markets) {
    message = message + market + "\n";
  }
  message = message + "Total: " + markets.length;
  message = message + "\n-------------------------------------------";

  discordAlertChannel.send(message);
}

/**
 * Functions to cronjob
 */
module.exports = {
  startSubgraphHealthTracker: async function () {
    // every hour at min 0
    let scheduledMessage = new cron.CronJob("0 * * * *", async () => {
      await checkSubgraphs();
    });

    scheduledMessage.start();
  },
  startNegativeBalancesChecker: async function () {
    // every day at 3:30am UTC
    let scheduledChecker = new cron.CronJob("30 13 * * *", async () => {
      await checkNegativeBalances();
    });
    scheduledChecker.start();
  },
};
