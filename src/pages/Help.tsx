import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MessageCircle, 
  HelpCircle, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  RefreshCw,
  CheckCircle2,
  Clock,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Help = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportTeam = [
    {
      name: 'Rushikesh',
      phone: '9545952804',
      role: 'Customer Support Manager',
      available: 'Mon-Sat, 9 AM - 6 PM'
    },
    {
      name: 'Krishna',
      phone: '8261048075',
      role: 'Technical Support Specialist',
      available: 'Mon-Sat, 9 AM - 6 PM'
    }
  ];

  const faqs = [
    {
      category: 'Orders & Shipping',
      icon: ShoppingBag,
      questions: [
        {
          q: 'How can I track my order?',
          a: 'You can track your order by going to "Orders" in the menu and clicking on "Track Order" for any order. You\'ll see real-time updates on your order status.'
        },
        {
          q: 'What is the delivery time?',
          a: 'We offer 2-3 business days delivery. The exact delivery date will be shown in your order confirmation and tracking page.'
        },
        {
          q: 'Can I cancel my order?',
          a: 'Yes, you can cancel your order within 24 hours of placing it. Contact our support team for assistance.'
        }
      ]
    },
    {
      category: 'Payments',
      icon: CreditCard,
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit/debit cards, UPI, and net banking through Razorpay secure payment gateway.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes, all payments are processed through Razorpay, which is PCI-DSS compliant and uses industry-standard encryption.'
        },
        {
          q: 'I was charged but didn\'t receive my order',
          a: 'Please contact our support team immediately with your order ID and payment transaction ID. We\'ll resolve this within 24-48 hours.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      icon: RefreshCw,
      questions: [
        {
          q: 'What is your return policy?',
          a: 'You can return products within 7 days of delivery if they are unused and in original packaging. Refunds will be processed within 5-7 business days.'
        },
        {
          q: 'How do I initiate a return?',
          a: 'Contact our support team with your order ID and reason for return. We\'ll guide you through the process.'
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are processed within 5-7 business days after we receive and verify the returned product.'
        }
      ]
    },
    {
      category: 'Account & Security',
      icon: Shield,
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Go to the login page and click "Forgot Password". Enter your email and follow the instructions sent to your email.'
        },
        {
          q: 'How do I update my profile?',
          a: 'Go to your profile page from the menu and update your information. Changes are saved automatically.'
        },
        {
          q: 'Is my personal information safe?',
          a: 'Yes, we use industry-standard security measures to protect your personal information. We never share your data with third parties.'
        }
      ]
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Our support team will get back to you within 24 hours.",
        variant: "default",
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleCall = (phone: string, name: string) => {
    window.location.href = `tel:${phone}`;
    toast({
      title: "Calling...",
      description: `Connecting to ${name}`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-3">How Can We Help You?</h1>
        <p className="text-muted-foreground text-lg">
          We're here to assist you with any questions or concerns
        </p>
      </div>

      {/* Support Team Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {supportTeam.map((person, index) => (
          <Card key={index} className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{person.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{person.role}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="font-semibold">{person.available}</p>
                </div>
              </div>
              <Button
                onClick={() => handleCall(person.phone, person.name)}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call {person.name}: {person.phone}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/orders')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Track Order</h3>
              <p className="text-sm text-muted-foreground">Check your order status</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/orders')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Returns & Refunds</h3>
              <p className="text-sm text-muted-foreground">Manage your returns</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Chat with support</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send us a Message
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill out the form below and we'll get back to you as soon as possible
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="What is this regarding?"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="Tell us how we can help you..."
                className="resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqs.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.questions.map((faq, faqIndex) => (
                      <div key={faqIndex} className="border-l-4 border-primary/30 pl-4 py-2">
                        <h4 className="font-semibold mb-2 text-foreground">{faq.q}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Support Info */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground mb-2">
                We aim to respond to all inquiries within 24 hours during business days.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM IST
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;

