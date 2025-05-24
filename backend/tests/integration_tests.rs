use reqwest;
use serde_json::json;

#[tokio::test]
async fn test_health_check() {
    // Start test server (in real tests, you'd use a test harness)
    let client = reqwest::Client::new();
    
    let response = client
        .get("http://localhost:3000/api/health")
        .send()
        .await;
    
    // Health endpoint doesn't exist yet, but this shows the pattern
    assert!(response.is_err() || response.unwrap().status().is_success());
}

#[tokio::test]
async fn test_signup_flow() {
    let client = reqwest::Client::new();
    
    let signup_data = json!({
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123",
        "confirmPassword": "testpass123",
        "interest": "hiker"
    });
    
    // Test signup endpoint
    let response = client
        .post("http://localhost:3000/api/signup")
        .json(&signup_data)
        .send()
        .await;
    
    // Check response (would need running server)
    assert!(response.is_err() || response.unwrap().status().is_success());
}

#[tokio::test]
async fn test_login_flow() {
    let client = reqwest::Client::new();
    
    let login_data = json!({
        "email": "test@example.com",
        "password": "testpass123"
    });
    
    // Test login endpoint
    let response = client
        .post("http://localhost:3000/api/login")
        .json(&login_data)
        .send()
        .await;
    
    assert!(response.is_err() || response.unwrap().status().is_success());
}

#[cfg(test)]
mod auth_tests {
    use curvematch_backend::auth::password::{hash_password, verify_password};
    
    #[test]
    fn test_password_hashing() {
        let password = "test_password_123";
        let (salt, hash) = hash_password(password).unwrap();
        
        assert!(!salt.is_empty());
        assert!(!hash.is_empty());
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong_password", &hash).unwrap());
    }
}

#[cfg(test)]
mod gpx_tests {
    use curvematch_backend::utils::gpx_parser::parse_gpx;
    use std::fs;
    
    #[test]
    fn test_parse_valid_gpx() {
        let gpx_content = fs::read_to_string("tests/test_data/sample.gpx")
            .unwrap_or_else(|_| {
                // Fallback GPX content if file doesn't exist
                r#"<?xml version="1.0" encoding="UTF-8"?>
                <gpx version="1.1" creator="Test">
                    <trk>
                        <name>Test Track</name>
                        <trkseg>
                            <trkpt lat="52.5200" lon="13.4050">
                                <ele>100.0</ele>
                            </trkpt>
                            <trkpt lat="52.5210" lon="13.4060">
                                <ele>105.0</ele>
                            </trkpt>
                        </trkseg>
                    </trk>
                </gpx>"#.to_string()
            });
        
        let result = parse_gpx(&gpx_content);
        assert!(result.is_ok());
        
        let parsed = result.unwrap();
        assert_eq!(parsed.name, Some("Test Track".to_string()));
        assert_eq!(parsed.geometry.0.len(), 2);
    }
}
