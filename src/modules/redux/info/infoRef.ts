import {doc} from "firebase/firestore";
import {db} from "../../firebase/firebase";
import {orderInfoConverter} from "../../firebase/converters";

export const orderInfoRef = (shopId: string) => doc(db, `shops/${shopId}/info/order_info`).withConverter(orderInfoConverter)