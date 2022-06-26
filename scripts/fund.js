const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding contract, fam...")
    //var args = process.argv.slice(2)
    const txResponse = await fundMe.fund({
        value: ethers.utils.parseEther("1"),
    })
    await txResponse.wait(1)
    console.log("Contract funded. No cap. Fr")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
