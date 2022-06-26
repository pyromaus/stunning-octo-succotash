const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { devChains } = require("../../helper-hardhat-config")

!devChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // 1 ETH
          beforeEach(async function () {
              //deploy fundme contract using hardhat deploy
              //we built the tests step by step, and build
              //this list of variables as we need to as we add
              //the tests
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              // fetches deployer from accounts
              await deployments.fixture(["all"])
              // deploys all (contracts?) in contracts(?) folder
              fundMe = await ethers.getContract("FundMe", deployer)
              // getContract takes name of contract + signer
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("sets aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          // describe("receive", async function () {
          //     it("casts fund() function when no function is specified")
          //     const response = await fundMe.receive()
          // })
          describe("fund", async function () {
              it("Fails if not enough ETH is sent", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "didnt send enough USD"
                  )
              })
              it("updates amount funded data strucutre", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(sendValue.toString(), response.toString())
              })
              it("adds funder to array of funders y'all", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraws ETH from a single founder", async function () {
                  // arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  // act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  // gasCost

                  // assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBal.add(startingFundMeBalance).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )
              })
              it("testing cheaper withdraw w/ single founder...", async function () {
                  // arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  // act
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  // gasCost

                  // assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBal.add(startingFundMeBalance).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw with multiple funders", async function () {
                  // arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      // makes the function caller NOT the deployer
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  // act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  // assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBal).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )
                  // make sure funders reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("only owner may withdraw the funds", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackConnectedContract = await fundMe.connect(attacker)
                  await expect(
                      attackConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
              it("cheaper withdraw testing..", async function () {
                  // arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      // makes the function caller NOT the deployer
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  // act
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  // assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBal).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )
                  // make sure funders reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
