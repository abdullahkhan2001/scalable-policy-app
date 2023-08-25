
import {
  useApi,
  reactExtension,
  useCartLines,
  Text,
  BlockStack,
  GridItem,
  Grid,
  InlineLayout,
  useTotalAmount,
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState } from 'react';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);


const currencies = {
  "AED": "د.إ",
  "PKR": "Rs",
  "AFN": "؋",
  "ALL": "L",
  "AMD": "֏",
  "ANG": "ƒ",
  "AOA": "Kz",
  "ARS": "$",
  "AUD": "$",
  "AWG": "ƒ",
  "AZN": "₼",
  "BAM": "KM",
  "BBD": "$",
  "BDT": "৳",
  "USD": "$",
  "UYU": "$U",
  "VES": "Bs",
  "VND": "₫",
  "ZMW": "ZK",
  "ZWL": "Z$",
};

function Extension() {
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const [currency, setCurrency] = useState('');
  const { query } = useApi();
  const cartLine = useCartLines()
  const [cartLineproductPrice, setCartLineProductPrice] = useState(0);
  const ProductIds = cartLine.map((item) => item.merchandise.title);
  const { amount, currencyCode } = useTotalAmount();

  async function fetchProducts() {

    try {
      const queries = ProductIds.map((pId) => ({
        query: `
        query {
          products(first: 100, query: "${pId}") {
            nodes {
              id
              title
              variants(first: 1) {
                nodes {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
        `,
      }));

      const responses = await Promise.all(
        queries.map((q) => query(q.query, { variables: { first: 1 } }))
      );

      // @ts-ignore
      const fetchedProducts = responses.map((response) => response.data.products.nodes[0]);
      // console.log(fetchedProducts)

      // Perform calculations immediately after setting products
      let totalCompareAtPrice = 0;
      let totalCartLineProductPrice = 0;

      fetchedProducts.forEach((p) => {
        //@ts-ignore
        if (!isNaN(Number(p.variants.nodes[0]?.compareAtPrice?.amount))) {
          //@ts-ignore
          totalCompareAtPrice += Number(p.variants.nodes[0]?.compareAtPrice?.amount);
          // console.log('totalCompareAtPrice:', totalCompareAtPrice);

          //@ts-ignore
          setCurrency(currencies[p.variants.nodes[0]?.compareAtPrice?.currencyCode]);
        }
        //@ts-ignore
        totalCartLineProductPrice += Number(p.variants.nodes[0].price.amount);
        // console.log('totalCartLineProductPrice:', totalCartLineProductPrice);

      });

      setCompareAtPrice(totalCompareAtPrice);
      setCartLineProductPrice(totalCartLineProductPrice);

    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    fetchProducts();
  }, [cartLine]);

  return (
    <>
      <Grid spacing={'none'} padding={'none'}>
        <GridItem padding={'none'}>
          <InlineLayout spacing={'none'} padding={'none'}>
            <BlockStack inlineAlignment={'start'} spacing={'none'} padding={'none'}>
              <Text>Total: </Text>
            </BlockStack>
            <BlockStack inlineAlignment={'end'} spacing={'none'} padding={'none'}>
              <Text emphasis='bold'>{Math.round(compareAtPrice) > 0 ? amount : cartLineproductPrice} {currency}</Text>
            </BlockStack>
          </InlineLayout>

          {Math.round(compareAtPrice) > 0 && <InlineLayout spacing={'none'} padding={'none'}>
            <BlockStack inlineAlignment={'start'} spacing={'none'} padding={'none'}>
              <Text>Your's Saving: </Text>
            </BlockStack>
            <BlockStack inlineAlignment={'end'} spacing={'none'} padding={'none'}>
              <Text emphasis='bold'>{Math.round(cartLineproductPrice - compareAtPrice)} {currency}</Text>
            </BlockStack>
          </InlineLayout>}
        </GridItem>
      </Grid>
    </>
  );
}