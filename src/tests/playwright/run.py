#!/usr/bin/env python3

import argparse

# def main():
# with open('temp/hello.txt', 'w') as f:
# 	f.write("hello world")
print("hello world 123")

parser = argparse.ArgumentParser()
# print 2 arguments
parser.add_argument("arg1", help="first argument")
parser.add_argument("arg2", help="second argument")
args = parser.parse_args()

# print the arguments
print(args.arg1)
print(args.arg2)

# if __name__ == "__main__":
#     main()
