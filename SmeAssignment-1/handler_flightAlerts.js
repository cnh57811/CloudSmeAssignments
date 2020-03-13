'use strict';

const uuid = require('uuid')
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.postFlightAlert = async event => {
  console.log(JSON.stringify(event))
  const body = JSON.parse(event.body);
  const rule = body.rule
  const ruleEvents = rule.ruleEvents;

  for (var ruleEvent of ruleEvents) {
    try {
      const params = buildParams(rule, ruleEvent)
      const responsePr = await dynamoDb.put(params).promise();
      console.log("Success", responsePr)
    } catch (err) {
      console.log("Failure", err.message)
      return buildResponse(500);
    }
  };
  return buildResponse(200)
};

function buildResponse(statusCode) {
  if (statusCode !== 200) {
    return {
      statusCode: statusCode,
      body: 'Couldn\'t save the flight details.'
    };
  } else {
    return {
      statusCode: statusCode,
      body: 'Flight alert(s) saved.'
    }
  }
}

function buildParams(rule, ruleEvent) {
  return {
    TableName: process.env.FLIGHT_ALERT_TABLE_NAME,
    Item: {
      id: uuid.v1(),
      carrierFsCode: rule.carrierFsCode,
      flight_num: rule.flightNumber,
      departure_airport: rule.departureAirportFsCode,
      departure_date: String(rule.departure).substring(0,10),
      ruleEvent: ruleEvent.type
    }
  };
}
