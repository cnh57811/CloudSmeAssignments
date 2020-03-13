'use strict';

const uuid = require('uuid')
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.putFlightDetails = async event => {
  console.log(event)
  const data = JSON.parse(event.body);

  try {
    const params = buildParams(data)
    const responsePr = await dynamoDb.put(params).promise()
    console.log("Success", responsePr)
    return buildResponse(200)
  } catch (err) {
    console.log("Failure", err.message)
    return buildResponse(500);
  }
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
      body: 'Flight detail(s) saved.'
    }
  }
}

function buildParams(data) {
  console.log(data);
  return {
    TableName: process.env.FLIGHT_DETAILS_TABLE_NAME,
    Item: {
      id: uuid.v1(),
      policy_id: data.policy_id,
      email: data.email,
      cell: data.cell,
      flight_num: data.flight_num,
      carrier: data.carrier,
      departure_airport: data.departure_airport,
      departure_date: data.date,
      alert_id: data.alert_id
    }
  };
}
