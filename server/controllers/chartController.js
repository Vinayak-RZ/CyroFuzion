import { getAllPricePoints } from '../utils/priceStore.js';

export const getPriceDataByAuctionId = async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ error: 'auctionId is required' });
    }

    const allData = await getAllPricePoints();

    const auctionData = allData.filter(item => item.auction_id === auctionId);

    if (auctionData.length === 0) {
      return res.status(404).json({ message: 'No data found for this auction' });
    }

    return res.status(200).json(auctionData);
  } catch (error) {
    console.error('Error fetching auction chart data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
