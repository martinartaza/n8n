import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	IDataObject,
} from 'n8n-workflow';

export async function mercadoPagoApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('mercadoPagoApi');

	const baseUrl = 'https://api.mercadopago.com';

	const options: IRequestOptions = {
		method,
		uri: `${baseUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${credentials.accessToken}`,
			'Content-Type': 'application/json',
		},
		body,
		json: true,
	};

	return this.helpers.request(options);
}
