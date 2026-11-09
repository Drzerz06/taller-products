import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ok, forbidden, notFound, internalServerError } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return notFound('El producto no fue encontrado');

    const claims = event.requestContext.authorizer?.claims || event.requestContext.authorizer;
    const callerId = claims?.userId;

    const existing = await docClient.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { productId: id },
    }));

    if (!existing.Item) {
      return notFound('El producto no fue encontrado');
    }

    if (existing.Item.sellerId !== callerId) {
      return forbidden('Solo puedes borrar productos que tú hayas creado');
    }

    await docClient.send(new DeleteCommand({
      TableName: PRODUCTS_TABLE,
      Key: { productId: id },
    }));

    return ok({ message: 'Producto borrado exitosamente' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return internalServerError('Internal Server Error');
  }
};