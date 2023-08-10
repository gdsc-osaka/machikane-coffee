import React from "react";
import { 
        Select,
        MenuItem,
        Checkbox,      
        FormControl,
        InputLabel,
        Button
      } from '@mui/material';
// import makeStyles from "@mui/material/styles";

      

// const useStyles = makeStyles({
//   li:{
//     float: 'left',
//     width: '25%',
//   },
  
// });


const Admin = () => {

  // const classes = useStyles();

  const value = ["coffee", "tea"];
  const options = ["coffee", "tea"];
  const orders = [
    {
      "number" : 1,
      "name" : "コーヒー"
    },
    {
      "number" : 2,
      "name" : "コーヒー"
    },
  ];
    return (
      <div>
        <FormControl>
          <InputLabel>番号札</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            required={true}
            value={value}
            // label={"番号札"}
          >
            {options.map((option) => {
              return(
                <MenuItem>
                  {option}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>menu</InputLabel>
          <Select
            required={true}
            value={value}
            // label={"menu"}
          >
            {options.map((option) => {
              return(
                <MenuItem>
                  {option}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>age</InputLabel>
          <Select
            required={true}
            value={value}
            label={"age"}
          >
            {options.map((option) => {
              return(
                <MenuItem>
                  {option}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>gender</InputLabel>
          <Select          
            label={"gender"}
          >
            <MenuItem>M</MenuItem>
            <MenuItem>F</MenuItem>
          </Select>
        </FormControl>
        <Button>register</Button>
        <div>
          {orders.map((order) => {
            return(
              <div >
                <div>{order.number}</div>
                <div>{order.name}</div>
                <Checkbox/>
                <Checkbox/>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  export default Admin;
  