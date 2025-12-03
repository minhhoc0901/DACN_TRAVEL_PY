import React from 'react';
import HeroSection from '../components/HomePages/HeroSection';
import AboutSection from '../components/HomePages/AboutSection';
import DestinationsSection from '../components/HomePages/DestinationsSection';
import TravelPlanSection from '../components/HomePages/TravelPlanSection';
import TestimonialsSection from '../components/HomePages/TestimonialsSection';
import '../styles/HomePageCSS/HomePage.css';

const HomePage = () => {
    return (
        <>
            <HeroSection />
            <AboutSection />
            <DestinationsSection />
            <TravelPlanSection />
            <TestimonialsSection />
        </>
    );
};

export default HomePage;