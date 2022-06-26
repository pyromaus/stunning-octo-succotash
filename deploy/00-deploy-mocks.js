const { network } = require("hardhat")
const {
    devChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (devChains.includes(network.name)) {
        log("Local network detected. deploying mock contracts...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
            // the args here are to pass for the constructor function
        })
        log("Mocks deployed fam")
        log("--------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
