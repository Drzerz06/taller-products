import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ok, badRequest, notFound, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

export const updateStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) return notFound('El producto no fue encontrado');

    const body = JSON.parse(event.body || '{}');
    const { quantity } = body;

    if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return badRequest('El stock tiene que ser un valor positivo entero');
    }

    const existing = await docClient.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { productId },
    }));

    if (!existing.Item) return notFound('El producto no fue encontrado');

    if (existing.Item.stock < quantity) {
      return badRequest('Stock insuficiente');
    }

    const now = new Date().toISOString();
    await docClient.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { productId },
      UpdateExpression: 'SET stock = stock - :q, updatedAt = :now',
      ConditionExpression: 'stock >= :q',
      ExpressionAttributeValues: {
        ':q': quantity,
        ':now': now,
      },
    }));

    return ok({ message: 'Stock actualizado exitosamente' });
  } catch (error) {
    console.error('updateStock error:', error);
    return internalServerError('Internal Server Error');
  }
};