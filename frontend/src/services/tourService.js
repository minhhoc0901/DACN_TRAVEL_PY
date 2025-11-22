const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const tourService = {
    
    async getToursForSale(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            console.log('Fetching tours with filters:', queryParams.toString());
            
            const response = await fetch(`${API_BASE_URL}/tours/for-sale?${queryParams.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch tours');
            }
            
            const result = await response.json();
            console.log('getToursForSale response:', result);
            
            return result;
        } catch (error) {
            console.error('Error in getToursForSale:', error);
            throw error;
        }
    },

    async getFeaturedTours(limit = 8) {
        try {
            const response = await fetch(`${API_BASE_URL}/tours/featured?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch featured tours');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching featured tours:', error);
            throw error;
        }
    },

    // ✅ SỬA: Đổi từ /tours/detail/:id sang /tours/:id (khớp với route backend)
    async getTourDetail(tourId) {
        try {
            console.log('[tourService] Fetching tour detail for ID:', tourId);
            console.log('[tourService] URL:', `${API_BASE_URL}/tours/${tourId}`);
            
            const response = await fetch(`${API_BASE_URL}/tours/${tourId}`);
            
            console.log('[tourService] Response status:', response.status);
            console.log('[tourService] Response ok:', response.ok);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch tour details');
            }
            
            const result = await response.json();
            console.log('[tourService] getTourDetail result:', result);
            
            return {
                success: result.success !== false,
                data: result.tour || result.data,
                message: result.message
            };
        } catch (error) {
            console.error('[tourService] Error in getTourDetail:', error);
            throw error;
        }
    },

    async getTourDepartures(tourId) {
        try {
            console.log('[tourService] Fetching departures for tour ID:', tourId);
            console.log('[tourService] URL:', `${API_BASE_URL}/tour-departures/${tourId}/available`);
            
            const response = await fetch(`${API_BASE_URL}/tour-departures/${tourId}/available`);
            
            console.log('[tourService] Departures response status:', response.status);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('[tourService] No departures found');
                    return {
                        success: true,
                        data: []
                    };
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch departures');
            }
            
            const result = await response.json();
            console.log('[tourService] getTourDepartures result:', result);
            
            return {
                success: result.success !== false,
                data: result.data || result.departures || [],
                message: result.message
            };
        } catch (error) {
            console.error('[tourService] Error in getTourDepartures:', error);
            return {
                success: true,
                data: []
            };
        }
    }
};