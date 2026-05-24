use crate::http_dispatch::{dispatch, InvokeRequest};
use crate::state::AppState;
use crate::storage_commands::llm;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use marinara_core::AppError;
use serde::Deserialize;
use serde_json::{json, Value};
use std::convert::Infallible;
use std::net::SocketAddr;
use std::time::Instant;
use tokio::sync::mpsc;
use tokio_stream::wrappers::UnboundedReceiverStream;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct HttpState {
    app: AppState,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmStreamRequest {
    stream_id: String,
    request: Value,
}

pub async fn serve(state: AppState, addr: SocketAddr) -> Result<(), std::io::Error> {
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, router(state)).await
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/invoke", post(invoke))
        .route("/api/llm/stream", post(llm_stream))
        .route("/api/llm/stream/:stream_id/cancel", post(llm_stream_cancel))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(HttpState { app: state })
}

async fn health() -> Json<Value> {
    Json(json!({ "ok": true, "runtime": "marinara-server" }))
}

async fn invoke(
    State(state): State<HttpState>,
    Json(request): Json<InvokeRequest>,
) -> Result<Json<Value>, HttpError> {
    let command = request.command.clone();
    let started = Instant::now();
    println!("invoke {command} started");
    match dispatch(&state.app, request).await {
        Ok(value) => {
            println!("invoke {command} ok in {}ms", started.elapsed().as_millis());
            Ok(Json(value))
        }
        Err(error) => {
            println!(
                "invoke {command} error code={} message={} in {}ms",
                error.code,
                error.message,
                started.elapsed().as_millis()
            );
            Err(error.into())
        }
    }
}

async fn llm_stream(
    State(state): State<HttpState>,
    Json(body): Json<LlmStreamRequest>,
) -> Sse<UnboundedReceiverStream<Result<Event, Infallible>>> {
    let (tx, rx) = mpsc::unbounded_channel::<Result<Event, Infallible>>();
    tokio::spawn(async move {
        let stream_id = body.stream_id.clone();
        let started = Instant::now();
        println!("llm_stream {stream_id} started");
        let result = llm::llm_stream_events(&state.app, body.stream_id, body.request, |event| {
            let data = serde_json::to_string(&event)?;
            tx.send(Ok(Event::default().data(data)))
                .map_err(|error| AppError::new("sse_stream_error", error.to_string()))
        })
        .await;

        match result {
            Ok(()) => {
                println!(
                    "llm_stream {stream_id} ok in {}ms",
                    started.elapsed().as_millis()
                );
            }
            Err(error) => {
                println!(
                    "llm_stream {stream_id} error code={} message={} in {}ms",
                    error.code,
                    error.message,
                    started.elapsed().as_millis()
                );
                let payload = json!({
                    "type": "error",
                    "code": error.code,
                    "message": error.message,
                    "data": error.details,
                });
                let _ = tx.send(Ok(Event::default().data(payload.to_string())));
            }
        }
    });

    Sse::new(UnboundedReceiverStream::new(rx)).keep_alive(KeepAlive::default())
}

async fn llm_stream_cancel(
    State(state): State<HttpState>,
    Path(stream_id): Path<String>,
) -> Result<Json<Value>, HttpError> {
    let started = Instant::now();
    println!("llm_stream_cancel {stream_id} started");
    match llm::llm_stream_cancel(&state.app, &stream_id) {
        Ok(value) => {
            println!(
                "llm_stream_cancel {stream_id} ok in {}ms",
                started.elapsed().as_millis()
            );
            Ok(Json(value))
        }
        Err(error) => {
            println!(
                "llm_stream_cancel {stream_id} error code={} message={} in {}ms",
                error.code,
                error.message,
                started.elapsed().as_millis()
            );
            Err(error.into())
        }
    }
}

struct HttpError(AppError);

impl From<AppError> for HttpError {
    fn from(value: AppError) -> Self {
        Self(value)
    }
}

impl IntoResponse for HttpError {
    fn into_response(self) -> Response {
        let status = match self.0.code.as_str() {
            "not_found" => StatusCode::NOT_FOUND,
            "invalid_input" => StatusCode::BAD_REQUEST,
            "unsupported_command" => StatusCode::NOT_IMPLEMENTED,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };
        let payload = json!({
            "code": self.0.code,
            "message": self.0.message,
            "details": self.0.details,
        });
        (status, Json(payload)).into_response()
    }
}
