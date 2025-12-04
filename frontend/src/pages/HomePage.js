import React from 'react';
import HeroSection from '../components/HomePages/HeroSection';
import AboutSection from '../components/HomePages/AboutSection';
import DestinationsSection from '../components/HomePages/DestinationsSection';
import AIItinerarySection from '../components/HomePages/AIItinerarySection'; 
import TravelPlanSection from '../components/HomePages/TravelPlanSection';
import TestimonialsSection from '../components/HomePages/TestimonialsSection';
import '../styles/HomePageCSS/HomePage.css';

const HomePage = () => {
    return (
        <>
            <HeroSection />
            <AboutSection />
            <DestinationsSection />
            <AIItinerarySection />  
            <TravelPlanSection />
            <TestimonialsSection />
        </>
    );
};

export default HomePage;