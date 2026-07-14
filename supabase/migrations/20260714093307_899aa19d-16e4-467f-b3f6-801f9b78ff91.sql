
CREATE TABLE public.legal_documents (
  slug text PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_legal" ON public.legal_documents
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_insert_legal" ON public.legal_documents
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_legal" ON public.legal_documents
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_delete_legal" ON public.legal_documents
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_legal_updated
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_documents;

INSERT INTO public.legal_documents (slug, title, content) VALUES
('privacy-policy', 'Privacy Policy',
'# Privacy Policy

Your privacy matters to us. This Privacy Policy explains how FastCredit collects, uses, and protects the information you share with us when you use our platform.

## Information We Collect
- Account information: full name, email address, phone number, country, and currency preferences.
- Financial information: deposit receipts, wallet addresses, bank details, and transaction history.
- Technical information: device type, browser, IP address, and app usage data.
- Communications: messages you send to support or through our community channels.

## How We Use Your Data
- To create and manage your FastCredit account.
- To process deposits, upgrades, and withdrawals securely.
- To verify identity and prevent fraud.
- To send account notifications, transaction updates, and important announcements.
- To improve the platform, our services, and customer experience.

## Data Security
We use industry-standard security practices to protect your information:
- Encrypted connections (HTTPS) between your device and our servers.
- Encrypted storage of sensitive data.
- Strict access controls — only authorised staff can access account data.
- Continuous monitoring and regular security reviews.

## Cookies
FastCredit uses cookies and similar technologies to:
- Keep you signed in to your account.
- Remember your preferences (language, currency, theme).
- Analyse how the platform is used so we can improve it.

You can disable cookies in your browser settings, but some features of FastCredit may not work correctly without them.

## Your Rights
You have the right to:
- Access the personal information we hold about you.
- Request corrections to inaccurate information.
- Request deletion of your account and associated data.
- Withdraw consent for optional data processing at any time.

To exercise any of these rights, contact us using the details below.

## Contact Information
Email: support@fastcreditglobal.com
Website: fastcreditglobal.com

## Last Updated
This policy was last updated when saved from the Admin Panel.'),

('terms-of-service', 'Terms of Service',
'# Terms of Service

Welcome to FastCredit. By creating an account or using our services, you agree to the following terms.

## Eligibility
You must be at least 18 years old and legally able to enter into a binding agreement in your country of residence. FastCredit is not available where prohibited by local law.

## Account Registration
- You must provide accurate and complete information when signing up.
- You are responsible for keeping your password and account credentials secure.
- One account per person. Multiple or fraudulent accounts may be suspended.

## Deposits
- Deposits are processed once you upload a valid payment receipt.
- Deposits become active only after admin approval.
- Amounts must match the plan you selected.
- FastCredit is not responsible for funds sent to incorrect addresses or accounts.

## Withdrawals
- The minimum withdrawal amount is $100.
- You must upgrade a mining plan before making your first withdrawal.
- Withdrawals are reviewed and processed within the published support hours.
- Provide accurate wallet or bank details — incorrect details can delay or lose funds.

## Referral Program
- You may share your referral link with others.
- Referral rewards are credited when qualifying activity is completed.
- Self-referrals, fake accounts, and abusive referral activity are not allowed and may lead to loss of rewards.

## Prohibited Activities
You agree not to:
- Use FastCredit for money laundering, fraud, or any illegal purpose.
- Attempt to bypass security or access other users'' accounts.
- Post abusive, harmful, or misleading content on community channels.
- Automate or script activity on the platform.

## Account Suspension and Termination
FastCredit may suspend or terminate an account that violates these terms, is involved in suspicious activity, or is required to be suspended by law. Suspended users will see a notice on sign-in and can contact support for review.

## Changes to the Service
We may update, improve, or discontinue features at any time. Material changes to these terms will be communicated in-app or by email.

## Disclaimer
FastCredit provides digital investment services. All investments involve risk, and past performance does not guarantee future results. You are responsible for understanding the risks before depositing funds.

## Contact Information
Email: support@fastcreditglobal.com
Website: fastcreditglobal.com'),

('how-it-works', 'How FastCredit Works',
'# How FastCredit Works

FastCredit makes it simple to invest, mine, and grow your earnings from your phone.

## 1. Register
Create an account with your full name, email, phone, and country. Set a secure password to protect your funds.

## 2. Make a Deposit
Choose a payment method (crypto, bank transfer, or card where available), send your deposit, and upload the receipt inside the app. Deposits are approved by our team.

## 3. Choose an Investment Plan
Pick a Premium plan that fits your budget. Each plan has a fixed 14-day cycle and a per-tap mining reward.

## 4. Mine Daily
Once your plan is active you can mine up to two times per day. Every tap credits your mining reward directly to your balance.

## 5. Profits Are Credited Automatically
Rewards land in your FastCredit wallet the moment you mine. You can watch your balance grow in real time.

## 6. Withdraw Your Earnings
When your balance reaches at least $100, submit a withdrawal to your preferred bank or crypto wallet. Withdrawals are reviewed and released within the published support hours.

## 7. Earn With Referrals
Invite friends using your referral link and earn a commission on their qualifying activity.

## 8. Account Verification
For your security we may ask for basic verification before releasing larger withdrawals. Keep your profile up to date.

## Security Tips
- Never share your password or one-time codes with anyone.
- Only use official FastCredit support and community links from inside the app.
- Enable a strong password and change it if you suspect misuse.
- Beware of anyone promising ''guaranteed'' extra returns — FastCredit staff will never ask you to send money to a personal wallet.'),

('working-hours', 'Working Hours',
'# Support Working Hours

Our support team is available every day, including weekends and public holidays.

## Support Hours
Monday to Sunday · 8:00 AM – 8:00 PM (UTC)

## Average Response Time
- Live chat and WhatsApp: usually within 15 minutes.
- Email and Telegram: usually within 2 hours.
- Deposit approvals: usually within 30 minutes during support hours.
- Withdrawal approvals: usually within 2 hours during support hours.

## Time Zone
All times shown are in Coordinated Universal Time (UTC). Your local response times may vary depending on your region.

## Holiday Notice
FastCredit support runs 365 days a year. During major public holidays response times may be slightly slower than usual — thank you for your patience.'),

('company-info', 'Company Information',
'# About FastCredit

## Company Name
FastCredit

## What We Do
FastCredit is a digital investment and mining platform that helps everyday users grow their savings through simple, transparent daily rewards. Members choose an investment plan, mine daily, and withdraw their earnings on demand.

## Our Mission
To make earning from digital assets accessible, safe, and rewarding for everyone — no matter their background or experience level.

## Our Customer Commitment
- Clear, honest information about how the platform works.
- Fair and predictable rewards on every plan.
- Fast approvals for deposits and withdrawals during support hours.
- Responsive human support through email, WhatsApp, Telegram, and live chat.
- Continuous investment in security and reliability.

## Contact
Website: fastcreditglobal.com
Email: support@fastcreditglobal.com')
;
