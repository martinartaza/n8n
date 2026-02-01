import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MercadoPagoApi implements ICredentialType {
	name = 'mercadoPagoApi';

	displayName = 'MercadoPago API';

	documentationUrl = 'https://www.mercadopago.com.ar/developers/es/reference';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'User ID',
			name: 'userId',
			type: 'string',
			default: '',
			required: true,
			description: 'Tu user_id de MercadoPago (ej: 12345678)',
		},
		{
			displayName: 'POS External ID',
			name: 'externalPosId',
			type: 'string',
			default: 'default',
			required: true,
		},
		{
			displayName: 'Sandbox Mode',
			name: 'sandboxMode',
			type: 'boolean',
			default: false,
		},
	];
}
