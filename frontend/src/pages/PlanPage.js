import React from 'react';
import ItineraryModule from '../components/Itinerary/ItineraryModule';
const PlanPage = () => {
    return (
        <div className='plan-page '>
            <div className="container mx-auto mt-100">
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <ItineraryModule />
                </div>
            </div>
            
        </div>
    );
};

export default PlanPage;