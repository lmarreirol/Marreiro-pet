const BASE = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://www.asaas.com/api/v3'

function headers() {
  return {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY ?? '',
  }
}

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text) throw new Error(`Asaas HTTP ${res.status} — empty body`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Asaas HTTP ${res.status} — invalid JSON: ${text.slice(0, 200)}`)
  }
}

export async function asaasCreateOrFindCustomer(name: string, cpfCnpj: string, _phone?: string, email?: string) {
  const cpf = cpfCnpj.replace(/\D/g, '')

  const search = await fetch(`${BASE}/customers?cpfCnpj=${cpf}`, { headers: headers() })
  if (search.ok) {
    const data = await safeJson(search)
    if (data.data?.length > 0) return data.data[0] as { id: string }
  }

  const res = await fetch(`${BASE}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, cpfCnpj: cpf, ...(email ? { email } : {}) }),
  })
  return safeJson(res) as Promise<{ id: string; errors?: { code: string; description: string }[] }>
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
  return safeJson(res) as Promise<{ id: string; status: string; errors?: { description: string }[] }>
}

export async function asaasCreateCardPayment(data: {
  customerId: string
  value: number
  dueDate: string
  description: string
  externalReference: string
  successUrl: string
}) {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: data.customerId,
      billingType: 'CREDIT_CARD',
      value: data.value,
      dueDate: data.dueDate,
      description: data.description,
      externalReference: data.externalReference,
      callback: {
        successUrl: data.successUrl,
        autoRedirect: true,
      },
    }),
  })
  return safeJson(res) as Promise<{ id: string; status: string; invoiceUrl: string; errors?: { description: string }[] }>
}

export async function asaasGetPixQrCode(paymentId: string) {
  const res = await fetch(`${BASE}/payments/${paymentId}/pixQrCode`, { headers: headers() })
  return safeJson(res) as Promise<{ encodedImage: string; payload: string; expirationDate: string }>
}

export async function asaasGetPayment(paymentId: string) {
  const res = await fetch(`${BASE}/payments/${paymentId}`, { headers: headers() })
  return safeJson(res) as Promise<{ id: string; status: string; value: number }>
}
