use std::{
    fmt,
    ops::{Add, Sub},
};

use async_graphql::Enum;
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
    type Output = Result<Self, MonthError>;

    fn add(self, rhs: Self) -> Self::Output {
        match Month::from_number(self.to_number() + rhs.to_number()) {
            Some(val) => return Ok(val),
            None => return Err(MonthError::InvalidMonth),
        };
    }
}

impl Sub for Month {
    type Output = Result<Self, MonthError>;

    fn sub(self, rhs: Self) -> Self::Output {
        match Month::from_number(self.to_number() - rhs.to_number()) {
            Some(val) => return Ok(val),
            None => return Err(MonthError::InvalidMonth),
        };
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
    pub fn from_number(num: i32) -> Option<Self> {
        match num {
            1 => Some(Month::January),
            2 => Some(Month::February),
            3 => Some(Month::March),
            4 => Some(Month::April),
            5 => Some(Month::May),
            6 => Some(Month::June),
            7 => Some(Month::July),
            8 => Some(Month::August),
            9 => Some(Month::September),
            10 => Some(Month::October),
            11 => Some(Month::November),
            12 => Some(Month::December),
            _ => None,
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
