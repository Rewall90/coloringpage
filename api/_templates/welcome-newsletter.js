import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

export const WelcomeNewsletterEmail = () => (
  <Html>
    <Head />
    <Preview>Welcome to our coloring page newsletter! 🎨</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src={`${baseUrl}/images/logo.png`}
            width="50"
            height="50"
            alt="Logo"
            style={logo}
          />
          <Heading style={heading}>Welcome to Our Newsletter!</Heading>
        </Section>

        <Section style={heroSection}>
          <Text style={heroText}>
            🎨 Thank you for subscribing to updates about new coloring pages!
          </Text>
        </Section>

        <Section style={benefitsSection}>
          <Heading as="h2" style={subHeading}>
            What to Expect
          </Heading>
          <Section style={benefitItem}>
            <Text style={benefitText}>🎨 New coloring page releases</Text>
          </Section>
          <Section style={benefitItem}>
            <Text style={benefitText}>📚 Featured categories and themes</Text>
          </Section>
          <Section style={benefitItem}>
            <Text style={benefitText}>🎉 Special seasonal collections</Text>
          </Section>
          <Section style={benefitItem}>
            <Text style={benefitText}>💡 Coloring tips and techniques</Text>
          </Section>
        </Section>

        <Section style={ctaSection}>
          <Button href={`${baseUrl}/coloring-pages`} style={button}>
            Browse Coloring Pages
          </Button>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>
            You can unsubscribe at any time by clicking the unsubscribe link in our emails.
          </Text>
          <Text style={footerText}>
            We respect your privacy and will never share your email address.
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

const logoSection = {
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#007bff',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const heroSection = {
  padding: '0 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '0 20px 32px',
};

const heroText = {
  fontSize: '18px',
  lineHeight: '1.4',
  color: '#666666',
  padding: '24px 0',
  margin: '0',
};

const benefitsSection = {
  padding: '0 40px',
};

const subHeading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#333333',
  margin: '32px 0 16px',
};

const benefitItem = {
  margin: '8px 0',
};

const benefitText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#555555',
  margin: '0',
};

const ctaSection = {
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 auto',
};

const footerSection = {
  padding: '32px 40px 0',
  borderTop: '1px solid #eaeaea',
  margin: '32px 20px 0',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '8px 0',
};

export default WelcomeNewsletterEmail;