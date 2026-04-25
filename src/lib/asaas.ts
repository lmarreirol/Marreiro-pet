const BASE = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/api/v3'

function headers() {
  return {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY ?? '',
  }
}

export async function asaasCreateOrFindCustomer(name: string, cpfCnpj: string, phone?: string, email?: string) {
  // Check if customer already exists
  const search = await fetch(`${BASE}/customers?cpfCnpj=${cpfCnpj.replace(/\D/g, '')}`, { headers: headers() })
  if (search.ok) {
    const data = await search.json()
    if (data.data?.length > 0) return data.data[0] as { id: string }
  }

  const res = await fetch(`${BASE}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name,
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      ...(phone ? { phone: phone.replace(/\D/g, '') } : {}),
      ...(email ? { email } : {}),
    }),
  })
  return res.json() as Promise<{ id: string; errors?: { description: string }[] }>
}

export async function asaasCreatePixPayment(data: {
  customerId: string
  value: number
  dueDate: string
  description: string
  externalReference: string
}) {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: data.customerId,
      billingType: 'PIX',
      value: data.value,
      dueDate: data.dueDate,
      description: data.description,
      externalReference: data.externalReference,
    }),
  })
  return res.json() as Promise<{ id: string; status: string; errors?: { description: string }[] }>
}

export async function asaasGetPixQrCode(paymentId: string) {
  const res = await fetch(`${BASE}/payments/${paymentId}/pixQrCode`, { headers: headers() })
  return res.json() as Promise<{ encodedImage: string; payload: string; expirationDate: string }>
}

export async function asaasGetPayment(paymentId: string) {
  const res = await fetch(`${BASE}/payments/${paymentId}`, { headers: headers() })
  return res.json() as Promise<{ id: string; status: string; value: number }>
}
