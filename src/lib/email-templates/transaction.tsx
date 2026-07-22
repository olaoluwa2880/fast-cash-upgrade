import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

type TxKind = 'deposit' | 'withdrawal'
type TxEvent = 'submitted' | 'approved' | 'rejected'

interface Props {
  kind?: TxKind
  event?: TxEvent
  amount?: number
  currency?: string
  reason?: string
  name?: string
}

const HEADLINES: Record<string, string> = {
  'deposit:submitted': 'Deposit received — awaiting review',
  'deposit:approved': 'Deposit approved',
  'deposit:rejected': 'Deposit rejected',
  'withdrawal:submitted': 'Withdrawal request received',
  'withdrawal:approved': 'Withdrawal approved',
  'withdrawal:rejected': 'Withdrawal rejected',
}

const BODIES: Record<string, (amt: string) => string> = {
  'deposit:submitted': (a) =>
    `We've received your deposit of ${a}. Our team is reviewing it and your wallet will be credited once approved.`,
  'deposit:approved': (a) =>
    `Good news — your deposit of ${a} has been approved and credited to your FastCredit wallet.`,
  'deposit:rejected': (a) =>
    `Your deposit of ${a} was not approved. Please review the reason below and try again or contact support.`,
  'withdrawal:submitted': (a) =>
    `Your withdrawal request for ${a} has been submitted and is pending admin review.`,
  'withdrawal:approved': (a) =>
    `Your withdrawal of ${a} has been approved and is being sent to your chosen destination.`,
  'withdrawal:rejected': (a) =>
    `Your withdrawal of ${a} was not approved and the amount has been returned to your wallet.`,
}

export const TransactionEmail = ({
  kind = 'deposit',
  event = 'submitted',
  amount = 0,
  currency = 'USD',
  reason,
  name,
}: Props) => {
  const key = `${kind}:${event}`
  const amt = `${currency} ${Number(amount).toFixed(2)}`
  const headline = HEADLINES[key] ?? 'Transaction update'
  const body = (BODIES[key] ?? ((a: string) => `Your transaction of ${a} has been updated.`))(amt)
  const accent = event === 'approved' ? '#D4AF37' : event === 'rejected' ? '#dc2626' : '#8B6914'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headline} · {amt}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...brandBar, background: accent }}>
            <Text style={brand}>FastCredit Global</Text>
          </Section>
          <Section style={{ padding: '28px 28px 8px' }}>
            <Heading style={h1}>{headline}</Heading>
            <Text style={text}>Hi {name || 'there'},</Text>
            <Text style={text}>{body}</Text>
            <Section style={{ ...amountCard, borderColor: accent }}>
              <Text style={amountLabel}>Amount</Text>
              <Text style={{ ...amountValue, color: accent }}>{amt}</Text>
            </Section>
            {reason ? (
              <Text style={reasonText}>
                <strong>Reason:</strong> {reason}
              </Text>
            ) : null}
            <Hr style={hr} />
            <Text style={footer}>
              You can view the full details anytime inside your FastCredit
              dashboard.
            </Text>
            <Text style={footer}>© FastCredit Global</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TransactionEmail,
  subject: (data: Record<string, any>) => {
    const key = `${data.kind}:${data.event}`
    return HEADLINES[key] ?? 'FastCredit transaction update'
  },
  displayName: 'Transaction notification',
  previewData: {
    kind: 'deposit',
    event: 'submitted',
    amount: 120,
    currency: 'USD',
    name: 'Jane',
  },
} satisfies TemplateEntry

export default TransactionEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  border: '1px solid #eee',
  borderRadius: '14px',
  overflow: 'hidden' as const,
}
const brandBar = { padding: '18px 28px', textAlign: 'center' as const }
const brand = { color: '#0D0D0D', fontWeight: 900, fontSize: '18px', letterSpacing: '1px', margin: 0 }
const h1 = { fontSize: '22px', fontWeight: 800, color: '#0D0D0D', margin: '0 0 14px' }
const text = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0 0 12px' }
const amountCard = {
  border: '2px solid #D4AF37',
  borderRadius: '12px',
  padding: '16px',
  margin: '18px 0',
  textAlign: 'center' as const,
}
const amountLabel = { fontSize: '11px', color: '#666', textTransform: 'uppercase' as const, letterSpacing: '1.5px', margin: 0 }
const amountValue = { fontSize: '26px', fontWeight: 900, margin: '6px 0 0' }
const reasonText = { fontSize: '13px', color: '#555', background: '#fdf3f3', padding: '10px 12px', borderRadius: '8px', margin: '0 0 10px' }
const hr = { borderColor: '#eee', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#888', margin: '4px 0' }
