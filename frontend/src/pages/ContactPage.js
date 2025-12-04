import React from 'react';
import ContactHeader from '../components/Contact/ContactHeader';
import ContactForm from '../components/Contact/ContactForm';
import ContactInfo from '../components/Contact/ContactInfo';
import ContactFAQ from '../components/Contact/ContactFAQ';

const ContactPage = () => {
  return (
    <main className="contact-page">
      <ContactHeader />
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-6">
            <ContactForm />
          </div>
          <div className="col-lg-6">
            <ContactInfo />
          </div>
        </div>
      </div>
      <ContactFAQ />
    </main>
  );
};

export default ContactPage;