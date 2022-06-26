// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

//get funds from users
//withdraw funds
//set a minimum funding value in usd

import "./PriceConverter.sol";

error FundMe__NotOwner();

/** @title contract for crowd funding
    @author itz meh
    @notice to demo a sample funding contract
    @dev this implements price feeds as our library
 */

contract FundMe {
    // type declarations
    using PriceConverter for uint256;

    // state variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    // constants use less gas
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    // immutables use less gas as well
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "You aint the owner of this contract bby");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "didnt send enough USD"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        //require(msg.sender == i_owner, "you aren't the owner of this contract bby");
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex = funderIndex + 1
        ) {
            // for loop (starting index, ending index, step amount)
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //reset the array
        s_funders = new address[](0);
        // actually withdraw the funds
        // 1. transfer
        //payable(msg.sender).transfer(address(this).balance);
        // msg.sender = address
        // payable(msg.sender) = payable address

        // 2. send
        //bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //require(sendSuccess, "send failed");

        // 3. call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        //mappings cant be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    //what happens if someone send this contract
    //eth without calling fund()
    // receive()
    // fallback()

    //require(msg.value > 1e18, "ETH Minimum = 1.00"); //1e18 == 1 * 10 ** 18 = 1000000000000000000
}
