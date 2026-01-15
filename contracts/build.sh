#!/bin/bash

# EquiClear Smart Contracts Build Script
# This script builds and optionally deploys all Leo contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Add cargo bin to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Load environment variables from .env if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${BLUE}Loading environment variables from .env...${NC}"
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Network configuration
NETWORK="${ALEO_NETWORK:-testnet}"
ENDPOINT="${ALEO_ENDPOINT:-https://api.explorer.provable.com/v1}"

# Contracts to build (in dependency order)
CONTRACTS=("balance" "auction" "bid" "claim")

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Leo is installed
check_leo() {
    if ! command -v leo &> /dev/null; then
        print_error "Leo is not installed or not in PATH"
        echo "Please install Leo from https://github.com/ProvableHQ/leo"
        echo "Or add ~/.cargo/bin to your PATH"
        exit 1
    fi
    echo -e "Leo version: $(leo --version)"
}

# Build a single contract
build_contract() {
    local contract=$1
    local contract_dir="$SCRIPT_DIR/$contract"
    
    echo -e "${YELLOW}Building $contract...${NC}"
    
    if [ ! -d "$contract_dir" ]; then
        print_error "Contract directory not found: $contract_dir"
        return 1
    fi
    
    cd "$contract_dir"
    
    if leo build --network "$NETWORK" --endpoint "$ENDPOINT" 2>&1; then
        print_success "$contract built successfully"
        return 0
    else
        print_error "Failed to build $contract"
        return 1
    fi
}

# Deploy a single contract
deploy_contract() {
    local contract=$1
    local contract_dir="$SCRIPT_DIR/$contract"
    
    echo -e "${YELLOW}Deploying $contract...${NC}"
    
    # Check if private key is set
    if [ -z "$ALEO_PRIVATE_KEY" ]; then
        print_error "ALEO_PRIVATE_KEY is not set. Please set it in .env or export it."
        return 1
    fi
    
    cd "$contract_dir"
    
    if leo deploy --network "$NETWORK" --endpoint "$ENDPOINT" --private-key "$ALEO_PRIVATE_KEY" --broadcast 2>&1; then
        print_success "$contract deployed successfully"
        return 0
    else
        print_error "Failed to deploy $contract"
        return 1
    fi
}

# Clean build artifacts for a contract
clean_contract() {
    local contract=$1
    local contract_dir="$SCRIPT_DIR/$contract"
    
    if [ -d "$contract_dir/build" ]; then
        echo -e "${YELLOW}Cleaning $contract build artifacts...${NC}"
        rm -rf "$contract_dir/build"
        print_success "$contract cleaned"
    fi
}

# Main function
main() {
    local command="${1:-build}"
    local specific_contract="$2"
    
    print_header "EquiClear Contracts - $command"
    
    # Check Leo installation
    check_leo
    
    echo ""
    echo "Network: $NETWORK"
    echo "Endpoint: $ENDPOINT"
    echo ""
    
    # Determine which contracts to process
    local contracts_to_process=()
    if [ -n "$specific_contract" ]; then
        contracts_to_process=("$specific_contract")
    else
        contracts_to_process=("${CONTRACTS[@]}")
    fi
    
    case "$command" in
        build)
            print_header "Building Contracts"
            local failed=0
            for contract in "${contracts_to_process[@]}"; do
                if ! build_contract "$contract"; then
                    failed=1
                fi
                echo ""
            done
            
            if [ $failed -eq 0 ]; then
                print_header "Build Complete"
                print_success "All contracts built successfully!"
            else
                print_header "Build Failed"
                print_error "Some contracts failed to build"
                exit 1
            fi
            ;;
            
        deploy)
            print_header "Deploying Contracts"
            
            # Verify private key is available
            if [ -z "$ALEO_PRIVATE_KEY" ]; then
                print_error "ALEO_PRIVATE_KEY environment variable is required for deployment"
                echo ""
                echo "Please set it by either:"
                echo "  1. Adding ALEO_PRIVATE_KEY=your_key to .env file"
                echo "  2. Running: export ALEO_PRIVATE_KEY=your_key"
                exit 1
            fi
            
            local failed=0
            for contract in "${contracts_to_process[@]}"; do
                if ! deploy_contract "$contract"; then
                    failed=1
                fi
                echo ""
            done
            
            if [ $failed -eq 0 ]; then
                print_header "Deployment Complete"
                print_success "All contracts deployed successfully!"
            else
                print_header "Deployment Failed"
                print_error "Some contracts failed to deploy"
                exit 1
            fi
            ;;
            
        clean)
            print_header "Cleaning Build Artifacts"
            for contract in "${contracts_to_process[@]}"; do
                clean_contract "$contract"
            done
            print_success "Clean complete!"
            ;;
            
        rebuild)
            print_header "Rebuilding Contracts"
            # Clean first
            for contract in "${contracts_to_process[@]}"; do
                clean_contract "$contract"
            done
            echo ""
            # Then build
            local failed=0
            for contract in "${contracts_to_process[@]}"; do
                if ! build_contract "$contract"; then
                    failed=1
                fi
                echo ""
            done
            
            if [ $failed -eq 0 ]; then
                print_header "Rebuild Complete"
                print_success "All contracts rebuilt successfully!"
            else
                print_header "Rebuild Failed"
                print_error "Some contracts failed to build"
                exit 1
            fi
            ;;
            
        *)
            echo "Usage: $0 {build|deploy|clean|rebuild} [contract_name]"
            echo ""
            echo "Commands:"
            echo "  build   - Build all contracts (default)"
            echo "  deploy  - Deploy all contracts to the network (requires ALEO_PRIVATE_KEY)"
            echo "  clean   - Remove build artifacts"
            echo "  rebuild - Clean and rebuild all contracts"
            echo ""
            echo "Options:"
            echo "  contract_name - Optional: specify a single contract (balance, auction, bid, claim)"
            echo ""
            echo "Environment variables:"
            echo "  ALEO_PRIVATE_KEY - Private key for deployment (required for deploy)"
            echo "  ALEO_NETWORK     - Network to use (default: testnet)"
            echo "  ALEO_ENDPOINT    - API endpoint (default: https://api.explorer.provable.com/v1)"
            echo ""
            echo "Examples:"
            echo "  $0                    # Build all contracts"
            echo "  $0 build balance      # Build only balance contract"
            echo "  $0 deploy             # Deploy all contracts"
            echo "  $0 deploy auction     # Deploy only auction contract"
            echo "  $0 clean              # Clean all build artifacts"
            exit 1
            ;;
    esac
}

main "$@"
