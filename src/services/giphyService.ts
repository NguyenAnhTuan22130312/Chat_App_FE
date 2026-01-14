// Giphy API Service
const GIPHY_API_KEY = 'FP7So78gh3RqurbvZBgQGei7M7KZFrPt';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

export interface GiphyGif {
    id: string;
    title: string;
    images: {
        fixed_height: {
            url: string;
            width: string;
            height: string;
        };
        fixed_width: {
            url: string;
            width: string;
            height: string;
        };
        downsized: {
            url: string;
            width: string;
            height: string;
        };
        original: {
            url: string;
            width: string;
            height: string;
        };
    };
}

interface GiphyResponse {
    data: GiphyGif[];
    pagination?: {
        total_count: number;
        count: number;
        offset: number;
    };
}

/**
 * Tìm kiếm GIF theo từ khóa
 */
export const searchGifs = async (query: string, limit: number = 20): Promise<GiphyGif[]> => {
    try {
        if (!query.trim()) {
            return getTrendingGifs(limit);
        }

        const response = await fetch(
            `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g&lang=vi`
        );

        if (!response.ok) {
            console.error('Lỗi API của GIPHY:', response.status);
            return [];
        }

        const data: GiphyResponse = await response.json();
        return data.data;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm GIF:', error);
        return [];
    }
};

/**
 * Lấy danh sách GIF trending
 */
export const getTrendingGifs = async (limit: number = 20): Promise<GiphyGif[]> => {
    try {
        const response = await fetch(
            `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
        );

        if (!response.ok) {
            console.error('Lỗi API của GIPHY:', response.status);
            return [];
        }

        const data: GiphyResponse = await response.json();
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy GIF trending:', error);
        return [];
    }
};
