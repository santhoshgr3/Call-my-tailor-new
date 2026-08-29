import { save, load } from './lib.mjs';

// ---- site.json : global content ----
const site = {
  brand: 'Call My Tailor',
  tagline: 'For Custom Clothing',
  top_bar: ['Gurranteed Fitting', 'Free Home Visit'],
  socials: {
    instagram: 'https://www.instagram.com/doorstep_tailor_drapper',
    facebook: 'https://www.facebook.com/share/1GeVVaWS33/',
    linkedin: 'https://www.linkedin.com/company/call-my-tailor/',
    youtube: 'https://www.youtube.com/@callmytailor9266',
    pinterest: 'https://in.pinterest.com/callmytailorstyle/',
  },
  contact: {
    address: 'Shop No : 2/1229, Street-13, Area : GovindPuri, Kalkaji, New Delhi-19, India',
    phone: '+91 888-2222-900',
    phone_raw: '918882222900',
    whatsapp: '918882222900',
    email: 'callmytailor@gmail.com',
    alt_email: 'sharmasformal@gmail.com',
    hours: 'Time : 08:00 AM to 08:00 PM | Day : Wednesday–Monday | Closed: Tuesday',
    people: [
      { role: 'Customer Service / Sales', name: 'Kavi Sharma' },
      { role: 'Customer Care', name: 'Chandan Sharma' },
    ],
  },
  booking_url: 'https://booking.callmytailor.com/',
  top_tags: ['Formal Suit', 'Party suit', 'Casual suit', 'Tuxedo', 'Bandhgala suit', 'Kurta jacket', 'indo-western', 'Sherwani', 'Shirts', 'Simple Kurta', 'Punjabi Kurta'],
  specializations: [
    { title: 'Wedding Attire', slug: 'wedding-attire' },
    { title: 'Ethnic Wear', slug: 'ethnic-wear' },
    { title: 'Accessories', slug: 'accessories' },
    { title: 'Suit & Blazer', slug: 'suit-blazer' },
  ],
  order_by_category: [
    { label: 'FORMAL SUIT', slug: 'suit-blazer/formal-suit' },
    { label: 'PARTY SUIT', slug: 'suit-blazer/party-suits' },
    { label: 'TUXEDO', slug: 'suit-blazer/tuxedo' },
    { label: 'BANDHGALA SUIT', slug: 'ethnic-wear/bandhgala-suit' },
    { label: 'INDO WESTERN', slug: 'ethnic-wear/indo-western' },
    { label: 'SHERWANI', slug: 'wedding-attire/sherwani' },
    { label: 'KURTA', slug: 'kurta' },
    { label: 'REGULAR WEAR', slug: 'regular-wear' },
    { label: 'ACCESSORIES', slug: 'accessories' },
  ],
  footer_information_links: [
    { text: 'About Us', href: '/about-us' },
    { text: 'Why call my tailor', href: '/why-callmytailor' },
    { text: "FAQ's", href: '/faqs' },
    { text: 'Testimonials', href: '/testimonials' },
    { text: 'How it works', href: '/how-it-works' },
    { text: 'Price List', href: '/price-list' },
    { text: 'Terms and Conditions', href: '/terms-and-conditions' },
    { text: 'Privacy Policy', href: '/privacy-policy' },
    { text: 'Refund & Replacement', href: '/refund-replacement' },
    { text: 'Complaint & Advise', href: '/complaint-advice' },
    { text: 'Payment Method', href: '/payment-method' },
    { text: 'Track My Order', href: '/track-my-order' },
    { text: 'Contact Us', href: '/contact-us' },
    { text: 'Join Us', href: '/join-us' },
    { text: 'Customer Support', href: '/customer-support' },
    { text: 'Gallery', href: '/gallery' },
  ],
  payment_partners: ['Visa', 'Mastercard', 'RuPay', 'UPI', 'Paytm', 'Razorpay'],
};
save('site.json', site);

// ---- patch home.json ----
const home = load('home.json');
home.how_it_works = [
  { step: 1, title: 'SELECT YOUR PRODUCT', text: 'UPLOAD YOUR DESIGN' },
  { step: 2, title: 'BOOK YOUR HOME VISIT', text: 'AND PLACE YOUR ORDER' },
  { step: 3, title: 'GET MEASURED AT HOME', text: 'AND CHOOSE YOUR FABRICS' },
  { step: 4, title: 'GET DELIVERED AT HOME', text: 'AFTER GETTING TRIAL' },
];
home.promo_banners = [
  { src: 'https://callmytailor.com/image/catalog/banners/home-banner/wedding-collection.jpg', alt: 'Wedding Collection', link: '/wedding-attire', title: 'Wedding Collection', subtitle: 'Sherwani • Indo-Western • Designer Suit', button: 'ORDER NOW' },
  { src: 'https://callmytailor.com/image/catalog/banners/home-banner/get-customize.jpg', alt: 'Get Customize', link: 'https://booking.callmytailor.com/', title: 'Get Customize', subtitle: 'Your Premium Suit — Party | Formal | Casual', button: 'BOOK NOW' },
];
home.section_titles = ['How It Work', 'Our Specialization', 'Order by category', 'Trending items', 'Testimonials', 'Latest Blog'];
home.product_rails = ['Best Sellers', 'New Arrivals', 'Most Rating'];
home.trending_tabs = ['All', 'Accessories', 'Ethnic Wear', 'Kurta', 'Suit/Blazer'];
save('home.json', home);

// ---- clean blog.json ----
let blog = load('blog.json').filter((b) => b.title && b.title.length < 120 && b.text && b.text.length > 400);
save('blog.json', blog);

// ---- summary ----
const products = load('products.json');
const cats = load('categories.json');
console.log('\n=== DATA SUMMARY ===');
console.log('categories:', cats.length);
console.log('products:', products.length);
console.log('  priced:', products.filter((p) => p.price).length);
console.log('  with images:', products.filter((p) => p.images && p.images.length).length);
console.log('  total images:', products.reduce((n, p) => n + (p.images ? p.images.length : 0), 0));
console.log('blog posts:', blog.length);
console.log('info pages:', load('pages.json').length);
