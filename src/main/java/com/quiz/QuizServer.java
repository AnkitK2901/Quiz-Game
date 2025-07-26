package com.quiz;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

public class QuizServer {

    private static List<Question> allQuestions;

    public static void main(String[] args) throws IOException {
        // Load questions from resources
        try (InputStream is = QuizServer.class.getResourceAsStream("/questions.json")) {
            if (is == null) {
                System.err.println("❌ Error: questions.json not found in resources.");
                return;
            }
            allQuestions = Arrays.asList(new Gson().fromJson(new InputStreamReader(is), Question[].class));
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(8081), 0);
        System.out.println("✅ Server started at http://localhost:8081/");

        // Contexts
        server.createContext("/", QuizServer::serveStaticFile);
        server.createContext("/api/questions", QuizServer::handleQuestionsRequest); // ✅ Only once
        server.createContext("/api/info", QuizServer::handleInfoRequest);

        server.setExecutor(null); // default executor
        server.start();
    }

    private static void handleQuestionsRequest(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        int count = Integer.parseInt(query.split("=")[1]);

        List<Question> randomizedQuestions = new ArrayList<>(allQuestions);
        Collections.shuffle(randomizedQuestions);
        List<Question> selectedQuestions = randomizedQuestions.subList(0, Math.min(count, allQuestions.size()));

        String response = new Gson().toJson(selectedQuestions);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }

    private static void handleInfoRequest(HttpExchange exchange) throws IOException {
        String response = String.format("{\"totalQuestions\": %d}", allQuestions.size());

        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }

    private static void serveStaticFile(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String resourcePath = path.equals("/") || path.isEmpty() ? "/static/index.html" : "/static" + path;

        try (InputStream is = QuizServer.class.getResourceAsStream(resourcePath)) {
            if (is == null) {
                String response = "404 Not Found";
                exchange.sendResponseHeaders(404, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
                return;
            }

            exchange.sendResponseHeaders(200, 0);
            try (OutputStream os = exchange.getResponseBody()) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
            }
        }
    }
}
