import {collection, doc, getDocs, onSnapshot, setDoc, Timestamp, updateDoc} from "firebase/firestore";
import {db, storage} from "../../firebase/firebase";
import {productConverter} from "../../firebase/converters";
import {createAsyncThunk, Dispatch} from "@reduxjs/toolkit";
import {PayloadProduct, Product, ProductForAdd, ProductForUpdate} from "./productTypes";
import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {RootState} from "../store";
import {
    productAdded, productIdle,
    productPending,
    productRejected,
    productRemoved,
    productSucceeded,
    productUpdated,
    selectProductById
} from "./productsSlice";

const productsRef = (shopId: string) => collection(db, `shops/${shopId}/products`).withConverter(productConverter);
export const productRef = (shopId: string, productId: string) => doc(db, `shops/${shopId}/products/${productId}`).withConverter(productConverter)
const getThumbnailPath = (shopId: string, productId: string) => `${shopId}/${productId}/thumbnail`;

export const fetchProducts = createAsyncThunk("products/fetchProducts",
    async (shopId: string, {dispatch, rejectWithValue}) => {
        dispatch(productPending({shopId}));

        try {
            const snapshot = await getDocs(productsRef(shopId))
            const products = snapshot.docs.map(doc => doc.data());

            for (const product of products) {
                if (product.thumbnail_url === undefined || product.thumbnail_url === '') {
                    const thumbnailPath = product.thumbnail_path;
                    product.thumbnail_url = await getDownloadURL(ref(storage, thumbnailPath));
                }
            }
            return {shopId, products};

        } catch (error) {
            if (error instanceof Error) {
                dispatch(productRejected({shopId, error}))
            }

            return rejectWithValue(error);
        }

    });
export const addProduct = createAsyncThunk('products/addProduct',
    async ({shopId, productForAdd, thumbnailFile}: {
        shopId: string,
        productForAdd: ProductForAdd,
        thumbnailFile: File
    }, {rejectWithValue}) => {
        try {
            const thumbnailPath = getThumbnailPath(shopId, productForAdd.id);
            const payloadProduct: PayloadProduct = {...productForAdd, thumbnail_path: thumbnailPath, stock: 0, created_at: Timestamp.now()};
            await setDoc(productRef(shopId, productForAdd.id), payloadProduct);

            const thumbnailRef = ref(storage, thumbnailPath);

            try {
                // サムネは後からアップロード
                const uploadResult = await uploadBytes(thumbnailRef, thumbnailFile);
                const thumbnailUrl = await getDownloadURL(uploadResult.ref);

                const product: Product = {
                    ...payloadProduct,
                    id: productForAdd.id,
                    thumbnail_url: thumbnailUrl
                }

                return {shopId, product};

            } catch (e) {
                return rejectWithValue(e);
            }

        } catch (e) {
            return rejectWithValue(e)
        }
    });
export const updateProduct = createAsyncThunk<
    { shopId: string, product: Product } | undefined,
    { shopId: string, productId: string, productForUpdate: ProductForUpdate, thumbnailFile: File | undefined },
    { state: RootState }
>('products/updateProduct',
    async (
        {shopId, productId, productForUpdate, thumbnailFile},
        {getState, rejectWithValue}
    ) => {
        try {
            const oldProduct = selectProductById(getState(), shopId, productId);

            if (oldProduct !== null) {
                const product: Product = {...oldProduct, ...productForUpdate, stock: oldProduct.stock}; // FIXME stock uses old data
                const docRef = productRef(shopId, productId);
                if (thumbnailFile !== undefined) {
                    // サムネアップロード
                    const thumbnailPath = getThumbnailPath(shopId, productId);
                    const thumbnailRef = ref(storage, thumbnailPath);
                    await uploadBytes(thumbnailRef, thumbnailFile);
                }
                await updateDoc(docRef, productConverter.toFirestore(product));
                return {shopId, product};
            } else {
                return rejectWithValue('Old product does not exists.');
            }

        } catch (e) {
            return rejectWithValue(e);
        }
    })

export const streamProducts = (shopId: string, {dispatch}: {dispatch: Dispatch}) => {
    dispatch(productSucceeded({shopId}));

    const q = productsRef(shopId);

    const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
                const product = change.doc.data({ serverTimestamps: "estimate" });

                if (product.thumbnail_url === undefined || product.thumbnail_url.length === 0) {
                    product.thumbnail_url = await getDownloadURL(ref(storage, product.thumbnail_path));
                }

                console.log("added product")

                dispatch(productAdded({shopId, product}));
            }
            if (change.type === "modified") {
                const product = change.doc.data({ serverTimestamps: "estimate" });
                dispatch(productUpdated({shopId, product}));
            }
            if (change.type === "removed") {
                const productId = change.doc.id;
                dispatch(productRemoved({shopId, productId}));
            }
        });
    });

    return () => {
        dispatch(productIdle({shopId}))
        unsub();
    }
}