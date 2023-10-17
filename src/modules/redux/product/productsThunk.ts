import {collection, doc, getDocs, setDoc, updateDoc} from "firebase/firestore";
import {db, storage} from "../../firebase/firebase";
import {productConverter} from "../../firebase/converters";
import {createAsyncThunk} from "@reduxjs/toolkit";
import {PayloadProduct, Product, ProductForAdd, ProductForUpdate} from "./productTypes";
import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {RootState} from "../store";
import {selectProductById} from "./productsSlice";

const productsRef = (shopId: string) => collection(db, `shops/${shopId}/products`).withConverter(productConverter);
const productRef = (shopId: string, productId: string) => doc(db, `shops/${shopId}/products/${productId}`).withConverter(productConverter)
const getThumbnailPath = (shopId: string, productId: string) => `${shopId}/${productId}/thumbnail`;
export const fetchProducts = createAsyncThunk("products/fetchProducts",
    async (shopId: string) => {
        // TODO: エラーハンドリング
        const snapshot = await getDocs(productsRef(shopId))
        const products = snapshot.docs.map(doc => doc.data());

        for (const product of products) {
            const thumbnailPath = product.thumbnail_path;
            product.thumbnail_url = await getDownloadURL(ref(storage, thumbnailPath));
        }

        return products;
    });
export const addProduct = createAsyncThunk('products/addProduct',
    async ({shopId, productForAdd, thumbnailFile}: {
        shopId: string,
        productForAdd: ProductForAdd,
        thumbnailFile: File
    }, {rejectWithValue}) => {
        try {
            const thumbnailPath = getThumbnailPath(shopId, productForAdd.id);
            const product: PayloadProduct = {...productForAdd, thumbnail_path: thumbnailPath};
            await setDoc(productRef(shopId, productForAdd.id), product);

            const thumbnailRef = ref(storage, thumbnailPath);

            try {
                // サムネは後からアップロード
                await uploadBytes(thumbnailRef, thumbnailFile);

                return product;

            } catch (e) {
                rejectWithValue(e);
            }

        } catch (e) {
            rejectWithValue(e)
        }
    });
export const updateProduct = createAsyncThunk<Product | undefined, {
    shopId: string,
    productId: string,
    rawProduct: ProductForUpdate,
    thumbnailFile: File | undefined
}, { state: RootState }>('products/updateProduct',
    async ({shopId, productId, rawProduct, thumbnailFile}, {
        getState,
        rejectWithValue
    }): Promise<Product | undefined> => {
        try {
            const oldProduct = selectProductById(getState(), productId);

            if (oldProduct !== null) {
                const newProduct: Product = {...oldProduct, ...rawProduct};
                const docRef = productRef(shopId, productId);
                if (thumbnailFile !== undefined) {
                    // サムネアップロード
                    const thumbnailPath = getThumbnailPath(shopId, productId);
                    const thumbnailRef = ref(storage, thumbnailPath);
                    await uploadBytes(thumbnailRef, thumbnailFile);
                }
                await updateDoc(docRef, productConverter.toFirestore(newProduct));
                return newProduct;
            }

        } catch (e) {
            rejectWithValue(e);
        }
    })