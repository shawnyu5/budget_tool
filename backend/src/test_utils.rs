#[cfg(test)]
use chrono::Utc;

#[cfg(test)]
use crate::routes::{JwtClaim, MaybeJwt};

#[cfg(test)]
/// Create a mock JWT to be used for testing
pub fn mock_jwt() -> MaybeJwt {
    use crate::routes::MaybeJwt;

    return MaybeJwt(Some(JwtClaim {
        username: "shawn".to_owned(),
        exp: Utc::now().timestamp() + 3600,
    }));
}
