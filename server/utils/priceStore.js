import supabase from './supabaseClient.js'; 

export async function addPricePoint(data) {
  const { error } = await supabase
    .from('price_data')
    .insert([{
      timestamp: data.timestamp,
      price: data.price,
      is_auction: data.isAuction,
      resolver_id: data.resolverId,
      auction_id: data.auctionId
    }]);

  if (error) {
    console.error('Error inserting price point:', error.message);
  }
}

export async function getAllPricePoints() {
  const { data, error } = await supabase
    .from('price_data')
    .select('*')
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching price data:', error.message);
    return [];
  }

  return data;
}
