use std::{
    fmt,
    ops::{Add, Sub},
};

use async_graphql::Enum;
use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use utoipa::ToSchema;

#[derive(Error, Debug)]
pub enum MonthError {
    #[error("Invalid month")]
    InvalidMonth,
}

#[derive(Debug, Deserialize, PartialEq, ToSchema, Clone, Serialize, Copy, Enum, Eq)]
pub enum Month {
    #[graphql(name = "January")]
    January,
    #[graphql(name = "February")]
    February,
    #[graphql(name = "March")]
    March,
    #[graphql(name = "April")]
    April,
    #[graphql(name = "May")]
    May,
    #[graphql(name = "June")]
    June,
    #[graphql(name = "July")]
    July,
    #[graphql(name = "August")]
    August,
    #[graphql(name = "September")]
    September,
    #[graphql(name = "October")]
    October,
    #[graphql(name = "November")]
    November,
    #[graphql(name = "December")]
    December,
}

impl Add for Month {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        let a = self.to_number();
        let b = rhs.to_number();
        let result = ((a - b - 1).rem_euclid(12) + 1) as u32;
        Month::from_number(result.to_i32().unwrap())
    }
}

impl Sub for Month {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        let a = self.to_number();
        let b = rhs.to_number();
        let result = ((a - b - 1).rem_euclid(12) + 1) as u32;
        Month::from_number(result.to_i32().unwrap())
    }
}

impl From<String> for Month {
    #[track_caller]
    fn from(value: String) -> Self {
        match value.trim().to_lowercase().as_str() {
            "january" => Month::January,
            "february" => Month::February,
            "march" => Month::March,
            "april" => Month::April,
            "may" => Month::May,
            "june" => Month::June,
            "july" => Month::July,
            "august" => Month::August,
            "september" => Month::September,
            "october" => Month::October,
            "november" => Month::November,
            "december" => Month::December,
            _ => panic!("Invalid month string: {}", value),
        }
    }
}

impl Month {
    /// Get the numeric value of the month (1 for January, 12 for December).
    pub fn to_number(&self) -> i32 {
        match self {
            Month::January => 1,
            Month::February => 2,
            Month::March => 3,
            Month::April => 4,
            Month::May => 5,
            Month::June => 6,
            Month::July => 7,
            Month::August => 8,
            Month::September => 9,
            Month::October => 10,
            Month::November => 11,
            Month::December => 12,
        }
    }

    /// Convert a numeric value (1–12) into a `Month`.
    /// Will panic if given an invalid month number
    #[track_caller]
    pub fn from_number(num: i32) -> Self {
        match num {
            1 => Month::January,
            2 => Month::February,
            3 => Month::March,
            4 => Month::April,
            5 => Month::May,
            6 => Month::June,
            7 => Month::July,
            8 => Month::August,
            9 => Month::September,
            10 => Month::October,
            11 => Month::November,
            12 => Month::December,
            _ => panic!("Invalid month number"),
        }
    }
}

impl fmt::Display for Month {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let name = match self {
            Month::January => "January",
            Month::February => "February",
            Month::March => "March",
            Month::April => "April",
            Month::May => "May",
            Month::June => "June",
            Month::July => "July",
            Month::August => "August",
            Month::September => "September",
            Month::October => "October",
            Month::November => "November",
            Month::December => "December",
        };
        write!(f, "{}", name)
    }
}
