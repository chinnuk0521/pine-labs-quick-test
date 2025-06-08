import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Send, Key, CreditCard, AlertCircle, CheckCircle, Loader2, Settings, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  // Authentication state
  const [credentials, setCredentials] = useState({
    client_id: '844d40f0-81cf-4e87-9b89-9f1f35b8692e',
    client_secret: 'f420d050236741499ca5a529055b72e8',
    grant_type: 'client_credentials'
  });
  
  const [token, setToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenResponse, setTokenResponse] = useState(null);

  // Payment state
  const [paymentPayload, setPaymentPayload] = useState(`{
  "amount": 100,
  "currency": "INR",
  "order_id": "test_order_${Date.now()}",
  "customer": {
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "9876543210"
  },
  "payment_method": {
    "type": "card"
  },
  "return_url": "https://yoursite.com/success",
  "cancel_url": "https://yoursite.com/cancel"
}`);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [lastError, setLastError] = useState(null);

  // Generate OAuth token
  const generateToken = async () => {
    setTokenLoading(true);
    setTokenResponse(null);
    setLastError(null);

    try {
      // Use the Vite proxy - this will route to https://api.pluralonline.com/oauth2/token
      const response = await fetch('/api/pluralonline/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      setTokenResponse(data);

      if (response.ok && data.access_token) {
        setToken(data.access_token);
        toast({
          title: "Token Generated Successfully",
          description: "You can now make payment API calls",
        });
      } else {
        setLastError({
          type: 'token_error',
          message: data.error_description || data.error || 'Token generation failed',
          code: data.error
        });
      }
    } catch (error) {
      console.error('Token generation error:', error);
      
      setLastError({
        type: 'network_error',
        message: 'Failed to connect to Pine Labs API.',
        details: error.message
      });
    } finally {
      setTokenLoading(false);
    }
  };

  // Send payment request
  const sendPayment = async () => {
    if (!token) {
      toast({
        title: "Token Required",
        description: "Please generate a token first",
        variant: "destructive"
      });
      return;
    }

    setPaymentLoading(true);
    setPaymentResponse(null);
    setLastError(null);

    try {
      const payload = JSON.parse(paymentPayload);
      
      // Use the Vite proxy - this will route to https://api.pluralonline.com/v1/payments
      const response = await fetch('/api/pluralonline/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Payment response status:', response.status);
      console.log('Payment response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      setPaymentResponse(data);

      if (response.ok) {
        toast({
          title: "Payment Request Sent",
          description: "Check the response below for payment details",
        });
      } else {
        setLastError({
          type: 'payment_error',
          message: data.message || 'Payment request failed',
          code: data.error_code,
          details: data.details
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      if (error instanceof SyntaxError || error.message.includes('JSON')) {
        setLastError({
          type: 'json_error',
          message: 'Invalid JSON payload. Please check your syntax.',
          details: error.message
        });
      } else {
        setLastError({
          type: 'network_error',
          message: 'Failed to send payment request.',
          details: error.message
        });
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  const getErrorBadgeColor = (type) => {
    switch (type) {
      case 'token_error': return 'bg-orange-100 text-orange-800';
      case 'payment_error': return 'bg-red-100 text-red-800';
      case 'json_error': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900">Pine Labs API Tester</h1>
          <p className="text-gray-600 mt-2">Quick payment API integration testing with zero setup friction</p>
        </div>

        {/* Proxy Info */}
        <Alert className="border-green-200 bg-green-50">
          <Settings className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-green-800">Development Proxy Active</p>
              <p className="text-sm text-green-700">
                API calls are now routed through the Vite development server to bypass CORS restrictions. 
                No additional setup required!
              </p>
              <p className="text-xs text-green-600 bg-green-100 p-2 rounded">
                💡 <strong>For production:</strong> Implement these API calls through your backend service.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {lastError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getErrorBadgeColor(lastError.type)}>
                  {lastError.type.replace('_', ' ').toUpperCase()}
                </Badge>
                {lastError.code && (
                  <Badge variant="outline">{lastError.code}</Badge>
                )}
              </div>
              <p className="font-medium text-red-800">{lastError.message}</p>
              {lastError.details && (
                <p className="text-sm text-red-600 mt-1">{lastError.details}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Authentication Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                1. Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={credentials.client_id}
                    onChange={(e) => setCredentials({...credentials, client_id: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={credentials.client_secret}
                    onChange={(e) => setCredentials({...credentials, client_secret: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="grant_type">Grant Type</Label>
                  <Input
                    id="grant_type"
                    value={credentials.grant_type}
                    readOnly
                    className="font-mono text-sm bg-gray-50"
                  />
                </div>
              </div>

              <Button 
                onClick={generateToken} 
                disabled={tokenLoading || !credentials.client_id || !credentials.client_secret}
                className="w-full"
              >
                {tokenLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Token...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate Token
                  </>
                )}
              </Button>

              {token && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Token Generated</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(token)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs font-mono text-green-700 break-all">{token}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                2. Payment Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payload">Payment Payload (JSON)</Label>
                <Textarea
                  id="payload"
                  value={paymentPayload}
                  onChange={(e) => setPaymentPayload(e.target.value)}
                  className="font-mono text-sm h-48"
                  placeholder="Enter payment payload JSON..."
                />
              </div>

              <Button 
                onClick={sendPayment} 
                disabled={paymentLoading || !token || !paymentPayload.trim()}
                className="w-full"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Payment...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Payment Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Response Section */}
        {(tokenResponse || paymentResponse) && (
          <Card>
            <CardHeader>
              <CardTitle>API Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={paymentResponse ? "payment" : "token"}>
                <TabsList>
                  {tokenResponse && <TabsTrigger value="token">Token Response</TabsTrigger>}
                  {paymentResponse && <TabsTrigger value="payment">Payment Response</TabsTrigger>}
                </TabsList>
                
                {tokenResponse && (
                  <TabsContent value="token">
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(JSON.stringify(tokenResponse, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-auto max-h-96">
                        {JSON.stringify(tokenResponse, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                )}
                
                {paymentResponse && (
                  <TabsContent value="payment">
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(JSON.stringify(paymentResponse, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-auto max-h-96">
                        {JSON.stringify(paymentResponse, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Development Setup:</h4>
                <ul className="space-y-1">
                  <li>• Vite proxy handles CORS automatically</li>
                  <li>• No additional configuration needed</li>
                  <li>• Development server routes API calls seamlessly</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Common Errors:</h4>
                <ul className="space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">invalid_client</code> - Check client ID/secret</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">invalid_request</code> - Verify payload format</li>
                  <li>• Network errors - Check Pine Labs API status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
