import { Column } from "../layout/Column";
import { IconButton, Switch, TextField, Typography } from "@mui/material";
import { Expanded } from "../layout/Expanded";
import { useEffect, useMemo, useState } from "react";
import { Row } from "../layout/Row";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import {
  changeShopStatus,
  fetchShops,
  selectAllShops,
  selectShopById,
  selectShopStatus,
  updateShop,
} from "../../modules/redux/shop/shopsSlice";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../modules/redux/store";
import { BaristaMap, RawShop, Shop } from "../../modules/redux/shop/types";

const ShopManager = () => {
  //   const [name, setName] = useState("");

  const dispatch = useAppDispatch();
  const params = useParams();
  const shopId = params.shopId ?? "";

  const shopStatus = useSelector(selectShopStatus);
  const shop = useSelector<RootState, Shop | undefined>((state) =>
    selectShopById(state, shopId)
  );

  console.log("shop?.status: ");
  console.log(shop?.status);
  console.log(shop?.status === "pause_ordering");

  const [emgMsg, setEmgMsg] = useState(
    shop?.emg_message ? shop.emg_message : ""
  );

  // useMemo: shop?.baristasが変化した時に値を返す
  const baristas = useMemo<BaristaMap>(() => {
    console.log("useMemo: ");
    console.log(shop?.baristas);
    return shop?.baristas ?? { 1: "inactive" };
  }, [shop?.baristas]);

  //   const baristaCount = useMemo<number>(() => {
  //     return Object.keys(baristas).length;
  //   }, [baristas]);

  const [baristaCount, setBaristaCount] = useState(
    Object.keys(baristas).length ? Object.keys(baristas).length : 1
  );

  console.log("count: ");
  console.log(Object.keys(baristas).length);

  //   const emgMsg = useMemo<string>(() => {
  //     return shop?.emg_message ?? "";asq
  //   }, [shop?.emg_message]);

  // TODO 初期値 toggle button

  const name = useMemo<string>(() => {
    return shop?.display_name ?? "";
  }, [shop?.display_name]);

  const status = useMemo<string>(() => {
    console.log("status(useMemo): ");
    console.log(shop?.status);
    return shop?.status ?? "active";
  }, [shop?.status]);

  useEffect(() => {
    if (shopStatus === "idle" || shopStatus === "failed") {
      dispatch(fetchShops());
    }
  }, [dispatch, shopStatus]);

  // useEffect: baristasが変化した時に関数内を実行
  useEffect(() => {
    console.log(baristas);
  }, [baristas]);

  useEffect(() => {
    console.log("status: ");
    console.log(status);
  }, [status]);

  useEffect(() => {
    console.log();
  }, []);

  const handleEmergency = async (value: boolean) => {
    console.log("status(emergency)");
    console.log(shop?.status);
    if (shop?.baristas) {
      console.log("baristas length: " + Object.keys(shop?.baristas).length);
    }

    if (value) {
      // active
      // status
      await dispatch(
        changeShopStatus({ shopId: shopId, status: "pause_ordering" })
      );

      // emgMsg
      await dispatch(
        updateShop({
          shopId: shopId,
          rawShop: {
            display_name: name,
            baristas: baristas,
            emg_message: emgMsg,
          },
        })
      );
    } else {
      // pause
      // status
      await dispatch(changeShopStatus({ shopId: shopId, status: "active" }));

      // emgMsg
      await dispatch(
        updateShop({
          shopId: shopId,
          rawShop: { display_name: name, baristas: baristas, emg_message: "" },
        })
      );
    }
  };

  const handleBaristaCount = async (diff: number) => {
    const newCount = baristaCount + diff;

    // console.log("baristas(cnt) before: ");
    // console.log(baristas);
    // console.log(newCount);
    const trueBaristas = Object.assign({}, baristas); // make the copy

    if (newCount > 0) {
      if (diff > 0) {
        // 更新後のbarista数
        trueBaristas[newCount] = "inactive";
      } else {
        // 更新前のbarista数
        delete trueBaristas[baristaCount];
      }

      //   console.log("trueBaristas(cnt): ");
      //   console.log(trueBaristas);

      setBaristaCount(newCount);
      //   setBaristas(trueBaristas);

      await dispatch(
        updateShop({
          shopId: shopId,
          rawShop: {
            display_name: name,
            baristas: trueBaristas,
            emg_message: emgMsg,
          },
        })
      );

      //   console.log("baristas(cnt): ");
      //   console.log(baristas);

      await dispatch(changeShopStatus({ shopId: shopId, status: "active" }));
    }
  };

  return (
    <Column>
      <Typography variant={"h4"} sx={{ fontWeight: "bold" }}>
        管理
      </Typography>
      <Expanded>
        <Typography variant={"h5"} sx={{ fontWeight: "bold" }}>
          提供中止
        </Typography>
        <Switch
          //   disabled={emgMsg.length === 0}
          defaultChecked={shop?.status === "pause_ordering"}
          onChange={(e) => handleEmergency(e.target.checked)}
        />
      </Expanded>
      <TextField
        id="emg-message"
        label="メッセージ"
        variant="outlined"
        helperText={"入力すると提供中止ボタンが押せます"}
        value={emgMsg}
        onChange={(e) => setEmgMsg(e.target.value)}
        sx={{ width: "100%" }}
      />
      <Expanded>
        <Typography variant={"h5"} sx={{ fontWeight: "bold" }}>
          ドリップ担当者数
        </Typography>
        <Row>
          <IconButton onClick={() => handleBaristaCount(-1)}>
            <RemoveRoundedIcon />
          </IconButton>
          {baristaCount}人
          <IconButton onClick={() => handleBaristaCount(1)}>
            <AddRoundedIcon />
          </IconButton>
        </Row>
      </Expanded>
    </Column>
  );
};

export default ShopManager;
