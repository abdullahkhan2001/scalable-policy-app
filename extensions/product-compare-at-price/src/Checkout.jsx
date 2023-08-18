
import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
  useCartLines,
  Text,
  BlockStack,
  GridItem,
  Grid,
  InlineLayout
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState } from 'react';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const { query } = useApi();
  const cartLine = useCartLines()
  const [cartLineproductPrice, setCartLineProductPrice] = useState(0);
  const ProductIds = cartLine.map((item) => item.merchandise.title);


  async function fetchProducts() {
    setLoading(true)
    try {
      const queries = ProductIds.map((pId) => ({
        query: `
          query {
            products(first: 1, query: "${pId}") {
              nodes {
                id
                title
                images(first: 1) {
                  nodes {
                    url
                  }
                }
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
      // @ts-ignore
      setProducts(fetchedProducts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const checkStatus = () => {
    if (loading) {
      try {
        let totalCompareAtPrice = 0;
        let totalCartLineProductPrice = 0;

        products.forEach((p) => {
          //@ts-ignore
          if (!isNaN(parseFloat(p.variants.nodes[0]?.compareAtPrice?.amount))) {
            //@ts-ignore
            totalCompareAtPrice += parseFloat(p.variants.nodes[0]?.compareAtPrice?.amount);
          }
          //@ts-ignore
          totalCartLineProductPrice += parseFloat(p.variants.nodes[0].price.amount);
        });

        console.log('totalCompareAtPrice:', totalCompareAtPrice);
        console.log('totalCartLineProductPrice:', totalCartLineProductPrice);

        setCompareAtPrice(totalCompareAtPrice);
        setCartLineProductPrice(totalCartLineProductPrice);
      } catch (error) {
        console.error(error);
      }
    }
  }


  useEffect(() => {
    async function fetchDataAndStatus() {
      await fetchProducts();
      await checkStatus();
    }
    fetchDataAndStatus();
  }, [])

  return (
    <>
      {compareAtPrice > 0 ?
        <Grid spacing={'none'} padding={'none'}>
          <GridItem padding={'none'}>
            <InlineLayout spacing={'none'} padding={'none'}>
              <BlockStack inlineAlignment={'start'} spacing={'none'} padding={'none'}>
                <Text>Total: </Text>
              </BlockStack>
              <BlockStack inlineAlignment={'end'} spacing={'none'} padding={'none'}>
                <Text emphasis='bold'>{Math.round(compareAtPrice)}</Text>
              </BlockStack>
            </InlineLayout>
            <InlineLayout spacing={'none'} padding={'none'}>
              <BlockStack inlineAlignment={'start'} spacing={'none'} padding={'none'}>
                <Text>Your's Saving: </Text>
              </BlockStack>
              <BlockStack inlineAlignment={'end'} spacing={'none'} padding={'none'}>
                <Text emphasis='bold'>{Math.round(cartLineproductPrice - compareAtPrice)}</Text>
              </BlockStack>
            </InlineLayout>

          </GridItem>
        </Grid >
        : <InlineLayout spacing={'none'} padding={'none'}>
          <BlockStack inlineAlignment={'start'} spacing={'none'} padding={'none'}>
            <Text>Total </Text>
          </BlockStack>
          <BlockStack inlineAlignment={'end'} spacing={'none'} padding={'none'}>
            <Text emphasis='bold'>{Math.round(cartLineproductPrice)}</Text>
          </BlockStack>
        </InlineLayout>}
    </>
  );
}