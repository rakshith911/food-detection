// AWS Cognito Configuration
import { Amplify } from 'aws-amplify';

// AWS Cognito configuration
const cognitoConfig = {
  Auth: {
    region: 'us-east-1', // Change to your AWS region
    userPoolId: 'us-east-1_XXXXXXXXX', // Replace with your User Pool ID
    userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with your App Client ID
    authenticationFlowType: 'USER_SRP_AUTH',
    oauth: {
      domain: 'your-domain.auth.us-east-1.amazoncognito.com', // Replace with your domain
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'http://localhost:3002/',
      redirectSignOut: 'http://localhost:3002/',
      responseType: 'code'
    }
  }
};

// Initialize Amplify with Cognito configuration
Amplify.configure(cognitoConfig);

export default cognitoConfig;









