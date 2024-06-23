# llm-benchmark

## Simple Benchmarking for Large Language Models using k6.

### Running the benchmark

```bash
# Targeting an ollama server
TARGET_IP=127.0.0.1 make run-ollama

# Targeting an openai-compatible server
TARGET_IP=127.0.0.1 make run-openai
```