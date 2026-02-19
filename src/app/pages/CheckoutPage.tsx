import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { mockLockers } from '../data/items';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { ArrowLeft, MapPin, Clock, CreditCard, Smartphone, QrCode } from 'lucide-react';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  
  // Credit Card Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // PayNow
  const [showPayNowQR, setShowPayNowQR] = useState(false);

  useEffect(() => {
    if (cart.length === 0 && !isCheckingOut) {
      navigate('/cart');
    }
  }, [cart.length, navigate, isCheckingOut]);

  // Determine the locker based on cart items
  const getPickupLocker = () => {
    if (cart.length === 0) return mockLockers[0];
    
    // Group items by locker
    const lockerCounts = cart.reduce((acc, item) => {
      acc[item.lockerId] = (acc[item.lockerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Find the locker with most items (or first locker if tie)
    const primaryLockerId = Object.keys(lockerCounts).sort((a, b) => 
      lockerCounts[b] - lockerCounts[a]
    )[0];
    
    return mockLockers.find(l => l.id === primaryLockerId) || mockLockers[0];
  };

  const pickupLocker = getPickupLocker();

  const isPaymentValid = () => {
    if (paymentMethod === 'credit-card') {
      return cardNumber && cardName && expiryDate && cvv;
    } else if (paymentMethod === 'apple-pay') {
      return true; // Apple Pay doesn't need additional validation
    } else if (paymentMethod === 'paynow') {
      return showPayNowQR; // User must view QR code
    }
    return false;
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Generate a 6-digit numerical passcode
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store order info in sessionStorage for the receipt page
    const order = {
      id: Date.now().toString(),
      items: cart,
      total: getCartTotal() + 5,
      locker: pickupLocker,
      date: new Date().toISOString(),
      status: 'Processing',
      accessCode,
      email,
      phone,
      paymentMethod,
    };
    
    sessionStorage.setItem('lastOrder', JSON.stringify(order));
    clearCart();
    navigate('/confirmation');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">BumpBox - Secondlife</h1>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/cart">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pickup Location */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Pickup Location</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your items will be available for pickup at this locker
                </p>
                
                <div className="border border-blue-600 bg-blue-50 rounded-lg p-4">
                  <div>
                    <p className="font-semibold text-base mb-2">
                      {pickupLocker.name}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {pickupLocker.address}, {pickupLocker.city}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {pickupLocker.hours}
                      </div>
                      {pickupLocker.distance && (
                        <div className="text-sm font-medium text-blue-600">
                          {pickupLocker.distance} away
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Location based on item availability
                </p>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    {/* Credit Card */}
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === 'credit-card'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('credit-card')}
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="credit-card" id="credit-card" />
                        <Label htmlFor="credit-card" className="ml-3 flex items-center cursor-pointer">
                          <CreditCard className="h-5 w-5 mr-2" />
                          <span className="font-semibold">Credit/Debit Card</span>
                        </Label>
                      </div>
                    </div>

                    {/* Apple Pay */}
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === 'apple-pay'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('apple-pay')}
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="apple-pay" id="apple-pay" />
                        <Label htmlFor="apple-pay" className="ml-3 flex items-center cursor-pointer">
                          <Smartphone className="h-5 w-5 mr-2" />
                          <span className="font-semibold">Apple Pay</span>
                        </Label>
                      </div>
                    </div>

                    {/* PayNow */}
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === 'paynow'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('paynow')}
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="paynow" id="paynow" />
                        <Label htmlFor="paynow" className="ml-3 flex items-center cursor-pointer">
                          <QrCode className="h-5 w-5 mr-2" />
                          <span className="font-semibold">PayNow QR</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                {/* Payment Details */}
                <div className="mt-6">
                  {paymentMethod === 'credit-card' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input
                          id="cardName"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            maxLength={5}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            maxLength={4}
                            type="password"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'apple-pay' && (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        You'll be prompted to authorize payment with Apple Pay when you complete your order.
                      </p>
                      <p className="text-xs text-gray-500">
                        Make sure Apple Pay is set up on your device.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'paynow' && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      {!showPayNowQR ? (
                        <div className="text-center">
                          <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-4">
                            Click the button below to generate a PayNow QR code
                          </p>
                          <Button onClick={() => setShowPayNowQR(true)} variant="outline">
                            Generate PayNow QR Code
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="bg-white p-4 rounded-lg inline-block mb-4">
                            {/* Mock QR Code - In production, this would be a real QR code */}
                            <div className="w-48 h-48 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg flex items-center justify-center">
                              <QrCode className="h-32 w-32 text-white" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Scan this QR code with your banking app to pay ${getCartTotal() + 5}
                          </p>
                          <p className="text-xs text-gray-500">
                            PayNow UEN: 123456789A
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.title} x{item.quantity}
                      </span>
                      <span className="font-medium">${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${getCartTotal()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="font-medium">$5</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg">${getCartTotal() + 5}</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={!email || !phone || !isPaymentValid()}
                >
                  Complete Order
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  You'll receive an access code to collect your items
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
