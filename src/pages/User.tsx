import React from "react";
import { Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { NumberedTicket } from "../types/user/numberedTicket";
import { type } from "os";

const User = () => {

    const numberedTickets: NumberedTicket[] = [
      {
        id: "randomstring1",
        number: 1,
        status: "お受け取りありがとうございました。",
      },
      {
        id: "randomstring",
        number: 2,
        status: "できあがりました、お受け取り下さい。",
      },
      {
        id: "randomstring",
        number: 3,
        status: 3,
      },
    ];

    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              番号
            </TableCell>
            <TableCell>
              待ち時間
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {numberedTickets.map((numberedTicket) => {
            return (
              <TableRow>
                <TableCell>
                  {numberedTicket.number}
                </TableCell>
                <TableCell>
                  {typeof numberedTicket.status === "number" ? numberedTicket.status+"分" : numberedTicket.status}
                </TableCell>
              </TableRow>
            );
          })

          }
        </TableBody>
      </Table>
    );
  };
  
  export default User;
  