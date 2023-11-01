import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AsyncState, Unsubscribe} from "../stateType";
import {Shop} from "./shopTypes";
import {RootState} from "../store";
import {addShop, changeShopStatus, fetchShops, updateShop} from "./shopsThunk";

const shopsSlice = createSlice({
    name: "shops",
    initialState: {
        data: [],
        status: "idle",
        error: undefined,
    } as AsyncState<Shop[]>,
    reducers: {
        shopAdded(state, action: PayloadAction<Shop>) {
            state.data.push(action.payload);
        },
        shopUpdated(state, action: PayloadAction<Shop>) {
            const shop = action.payload;
            state.data.update(e => e.id === shop.id, shop);
        },
        /**
         * 指定した ID の shop を消去する
         * @param state
         * @param action 消去する shop の ID
         */
        shopRemoved(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.data.remove(e => e.id === id);
        },
        shopSucceeded(state) {
            state.status = 'succeeded'
        },
        shopIdle(state) {
            state.status = 'idle'
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchShops.pending, (state, _) => {
                state.status = 'loading'
            })
            .addCase(fetchShops.fulfilled, (state, action) => {
                state.status = 'succeeded'
                // Add any fetched posts to the array
                state.data = action.payload;
            })
            .addCase(fetchShops.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.error.message;
            })

        builder
            .addCase(addShop.fulfilled, (state, action) => {
                state.data.push(action.payload);
            })

        builder
            .addCase(updateShop.fulfilled, (state, action) => {
                const updatedShop = action.payload;

                if (updatedShop !== undefined) {
                    state.data.update(e => e.id === updatedShop.id, updatedShop);
                }
            })

        builder
            .addCase(changeShopStatus.fulfilled, (state, action) => {
                const shop = action.payload;
                if (shop !== undefined) {
                    state.data.update(e => e.id === shop.id, shop);
                }
            })
    }
});

const shopReducer = shopsSlice.reducer;
export default shopReducer;
export const {shopAdded, shopUpdated, shopRemoved, shopSucceeded, shopIdle} = shopsSlice.actions;

/**
 * shopId と一致する Shop エンティティを返す
 * @param state RootState
 * @param shopId Shop の ID
 */
export const selectShopById = (state: RootState, shopId: string) => state.shop.data.find(e => e.id === shopId);
export const selectAllShops = (state: RootState) => state.shop.data;
export const selectPublicShops = (state: RootState) => selectAllShops(state).filter(s => s.status !== 'inactive');
export const selectShopStatus = (state: RootState) => state.shop.status;
/**
 * 店が pause_ordering のとき, 何秒遅延しているかを返します. shopId に一致する Shop がない場合, 0 を返します.
 * */
export const selectShopDelaySeconds = (state: RootState, shopId: string) => {
    const shop = selectShopById(state, shopId);

    if (shop !== undefined) {
        const delayMilliSec = new Date().getTime() - shop.last_active_time.toDate().getTime();

        return delayMilliSec / 1000;
    } else {
        return 0;
    }
}