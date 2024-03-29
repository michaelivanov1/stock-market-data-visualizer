import React, { useReducer, useEffect } from "react";

import Plot from 'react-plotly.js';

import { ThemeProvider } from "@mui/material/styles";
import {
    Card,
    CardHeader,
    CardContent,
    Autocomplete,
    TextField,
    Box,
    Typography,
} from "@mui/material";

import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

import theme from "../../theme";

// import a helper that houses some useful functions
import { dataSetHelper } from "../../Helpers/helpers";


const DataVisualizationComponent = (props) => {

    // grab JSON url's from helper file
    const fetchAllTickersFromNYSEAndNASDAQURL = dataSetHelper.NYSEAndNASDAQCombination;

    // send snackbar messages to App.js
    const sendMessageToSnackbar = (msg) => {
        props.dataFromChild(msg);
    }

    useEffect(() => {
        fetchJsonDataSets();
    }, [])

    const initialState = {
        stockChartXValues: [],
        stockChartYValues: [],
        grabSelectedTickersName: "",
        grabSelectedTicker: "",
    };

    let stockChartXValuesArr = [];
    let stockChartYValuesArr = [];

    const reducer = (state, newState) => ({ ...state, ...newState });
    const [state, setState] = useReducer(reducer, initialState);


    const fetchAlphaVantageData = async (ticker) => {
        try {
            // NOTE: can only make 5 api calls per minute, or 500 api calls per day
            let alphavantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=full&symbol=${ticker}&interval=5min&apikey=${process.env.REACT_APP_API_KEY}`;

            let alphavantageUrlResponse = await fetch(alphavantageUrl);
            let alphavantageUrlJson = await alphavantageUrlResponse.json();

            for (let date in alphavantageUrlJson['Time Series (Daily)']) {
                // console.log(date)
                stockChartXValuesArr.push(date);
                stockChartYValuesArr.push(alphavantageUrlJson['Time Series (Daily)'][date]['1. open']);
            }
            setState({ stockChartXValues: stockChartXValuesArr });
            setState({ stockChartYValues: stockChartYValuesArr });
            sendMessageToSnackbar(`Found data for ${ticker}`);
        } catch (error) {
            sendMessageToSnackbar(`No data for ticker ${ticker}`);
        }
    }

    // handle changes in the autocomplete
    const autocompleteOnChange = (e, selectedTicker) => {
        let findStockNameByTicker = "";
        try {
            findStockNameByTicker = state.allDataFromNYSEAndNASDAQArray.find(n => n.ticker === selectedTicker);
            fetchAlphaVantageData(selectedTicker);
            console.log(`selected ticker: ${selectedTicker}`);
        } catch (e) {
            console.log(`error using autocomplete. autocomplete value is null: ${e}`);
        }
        if (selectedTicker) {
            // set stocks name based on user selection
            setState({ grabSelectedTickersName: findStockNameByTicker.name })
            // set stocks ticker based on user selection
            setState({ grabSelectedTicker: selectedTicker })
        }
    };

    // grab the JSON data sets and load them. called in useEffect
    const fetchJsonDataSets = async () => {
        try {
            setState({
                contactServer: true,
            });
            sendMessageToSnackbar("Attempting to load data from server...");

            let fetchAllTickersFromNYSEAndNASDAQResponse = await fetch(fetchAllTickersFromNYSEAndNASDAQURL);
            let fetchAllTickersFromNYSEAndNASDAQJson = await fetchAllTickersFromNYSEAndNASDAQResponse.json();

            sendMessageToSnackbar("Data visualization loaded");

            setState({
                allDataFromNYSEAndNASDAQArray: fetchAllTickersFromNYSEAndNASDAQJson,
                allTickersFromNYSEAndNASDAQArray: fetchAllTickersFromNYSEAndNASDAQJson.map((t) => t.ticker),
            });
        } catch (error) {
            console.log(`error loading JSON data sets: ${error}`);
            sendMessageToSnackbar("Error loading JSON data sets");
        }
    };


    return (
        <ThemeProvider theme={theme}>
            <Box textAlign='center'>
                <Card style={{ marginLeft: '25%', width: "50%", boxShadow: 'none' }}>
                    <CardHeader
                        title="Type in a ticker or pick one from the dropdown"
                        style={{ color: 'black', textAlign: "center" }}
                    />
                    <CardContent>
                        <Autocomplete
                            data-testid="autocomplete"
                            options={state.allTickersFromNYSEAndNASDAQArray}
                            getOptionLabel={(option) => option}
                            style={{ width: 300, margin: 'auto', color: theme.palette.primary.main }}
                            onChange={autocompleteOnChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="search by all tickers"
                                    variant="standard"
                                    fullWidth
                                />
                            )}
                        />
                    </CardContent>

                    <Typography>
                        {state.grabSelectedTickersName}
                    </Typography>

                    {state.grabSelectedTickersName !== "" &&
                        <CardContent>
                            <Plot
                                data={[
                                    {
                                        x: state.stockChartXValues,
                                        y: state.stockChartYValues,
                                        type: 'scatter',
                                        //mode: 'lines+markers',
                                        marker: { color: 'green' },
                                    }
                                ]}
                                config={{
                                    // turn off modebar on hover
                                    displayModeBar: false
                                }}
                                layout={{ width: '50%', height: '50%', /* title: `showing data for ${state.grabSelectedTicker}` */ }}
                            />
                        </CardContent>
                    }
                </Card>
            </Box>
        </ThemeProvider >
    );
}

export default DataVisualizationComponent;