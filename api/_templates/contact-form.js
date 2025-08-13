import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

export const ContactFormEmail = ({ name, email, subject, message }) => (
  <Html>
    <Head />
    <Preview>New contact form submission: {subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img
            src={`${baseUrl}/images/logo.png`}
            width="50"
            height="50"
            alt="Logo"
            style={logo}
          />
          <Heading style={heading}>New Contact Form Submission</Heading>
        </Section>

        <Section style={contactInfoSection}>
          <Section style={infoRow}>
            <Text style={label}>Name:</Text>
            <Text style={value}>{name}</Text>
          </Section>
          <Section style={infoRow}>
            <Text style={label}>Email:</Text>
            <Text style={value}>{email}</Text>
          </Section>
          <Section style={infoRow}>
            <Text style={label}>Subject:</Text>
            <Text style={value}>{subject}</Text>
          </Section>
        </Section>

        <Section style={messageSection}>
          <Heading as="h3" style={messageHeading}>
            Message:
          </Heading>
          <Section style={messageContent}>
            <Text style={messageText}>{message}</Text>
          </Section>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>
            This message was sent via the contact form on your website.
          </Text>
          <Text style={footerText}>
            Please reply directly to <strong>{email}</strong> to respond to this inquiry.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const headerSection = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderBottom: '2px solid #007bff',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '28px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#333333',
  textAlign: 'center' as const,
  margin: '16px 0 0',
};

const contactInfoSection = {
  backgroundColor: '#f8f9fa',
  padding: '24px 40px',
  margin: '24px 20px',
  borderRadius: '8px',
};

const infoRow = {
  margin: '12px 0',
  display: 'flex',
  alignItems: 'baseline',
};

const label = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '0 12px 0 0',
  minWidth: '80px',
  display: 'inline-block',
};

const value = {
  fontSize: '16px',
  color: '#555555',
  margin: '0',
};

const messageSection = {
  padding: '0 40px',
  margin: '24px 0',
};

const messageHeading = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#333333',
  margin: '0 0 16px',
};

const messageContent = {
  backgroundColor: '#ffffff',
  border: '1px solid #dddddd',
  borderRadius: '8px',
  padding: '20px',
  margin: '0',
};

const messageText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0',
  whiteSpace: 'pre-wrap',
};

const footerSection = {
  padding: '32px 40px 0',
  borderTop: '1px solid #eaeaea',
  margin: '32px 20px 0',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '8px 0',
};

export default ContactFormEmail;