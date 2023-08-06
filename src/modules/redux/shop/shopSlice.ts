import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {AsyncState} from "../stateType";
import {Shop} from "./types";
import {db} from "../../firebase/firebase";
import {shopConverter} from "../../firebase/converters";

export const fetchShop = createAsyncThunk("shop/fetchShop",
    async (shopId: string, {rejectWithValue}) => {
    const shopRef = db.collection('shops').doc(shopId);
    const snapshot = await shopRef.withConverter(shopConverter).get();

    if (snapshot.exists) {
        const data = snapshot.data();

        if (data == undefined) {
            // ドキュメントの型不一致などで data が undefined のとき, エラーを返す.
            throw rejectWithValue(`Data of ${shopId} is undefined!`);
        }

        return data;
    } else {
        // shopId のドキュメントが存在しない場合, エラーを返す.
        throw rejectWithValue(`Document ${shopId} doesn't exist in shops collection of firestore!`);
    }
});

const shopSlice = createSlice({
    name: "shop",
    initialState: {
        data: null,
        status: "idle",
        error: null,
    } as AsyncState<Shop | null>,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchShop.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(fetchShop.fulfilled, (state, action) => {
                state.status = 'succeeded'
                // Add any fetched posts to the array
                state.data = action.payload;
            })
            .addCase(fetchShop.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })
    }
});

const shopReducer = shopSlice.reducer;
export default shopReducer;