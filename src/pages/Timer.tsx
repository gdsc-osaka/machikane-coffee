import React from "react";
import { selectMaxCompleteAt } from "../modules/redux/order/ordersSlice";
import { useSelector } from "react-redux";
import { RootState } from "../modules/redux/store";
import TimeDisplay from "../components/Timer/TimeDisplay"

const Timer = () => {
  const selector = useSelector((state: RootState) => state);
  // const expectedEndTime: Date = selectMaxCompleteAt(selector);
  const expectedEndTime: Date = new Date(2023, 8, 11, 19);
  const now: Date = new Date();

  const orderWaitTime: number = expectedEndTime.getTime() - now.getTime();
  let orderWaitHour: number, orderWaitMinute: number;
  if ( orderWaitTime > 0 ) {
    orderWaitHour = Math.floor(orderWaitTime / (1000 * 60 * 60));
    orderWaitMinute = Math.floor(orderWaitTime / (1000 * 60)) % 60;
  } else {
    orderWaitHour = 0;
    orderWaitMinute = 0;
  }

  return (
    <div>
      <br/><br/><br/><br/>
      <div className="text-6xl text-black-700 text-center font-semibold">
        ただいまの待ち時間
      </div>
      <br/>
      <TimeDisplay
					className="count-down-timer"
					time={{
            hour: orderWaitHour,
            min: orderWaitMinute
          }}
					delimiter=" : "
					fontSize="7.8em"
				/>
    </div>
  );
};

  
export default Timer;
  